/**
 * Core processor that maps parsed terms into adapter-level query operations.
 */
import { DEFAULT_OPTIONS } from "./constants.js";
import { parseSieveModel } from "./parser.js";
import { getMethodExt } from "./extensions/MethodInfoExtended.js";
import { SieveException } from "./exceptions/SieveException.js";
import { SieveIncompatibleMethodException } from "./exceptions/SieveIncompatibleMethodException.js";
import { SieveMethodNotFoundException } from "./exceptions/SieveMethodNotFoundException.js";

function toComparableName(value, caseSensitive) {
    return caseSensitive ? value : value.toLowerCase();
}

function normalizeFieldMap(fields = {}) {
    if (Array.isArray(fields)) {
        return fields.map((field) => ({
            name: field.name,
            path: field.path ?? field.name,
            canFilter: Boolean(field.canFilter),
            canSort: Boolean(field.canSort),
            parseValue: field.parseValue,
        }));
    }

    return Object.entries(fields).map(([name, config]) => {
        if (typeof config === "string") {
            return {
                name,
                path: config,
                canFilter: true,
                canSort: true,
                parseValue: undefined,
            };
        }

        return {
            name,
            path: config?.path ?? name,
            canFilter: config?.canFilter ?? false,
            canSort: config?.canSort ?? false,
            parseValue: config?.parseValue,
        };
    });
}

function findField(fieldMap, requestedName, options, requirements) {
    const target = toComparableName(requestedName, options.caseSensitive);

    return fieldMap.find((field) => {
        const candidate = toComparableName(field.name, options.caseSensitive);
        if (candidate !== target) {
            return false;
        }

        if (requirements.canFilter && !field.canFilter) {
            return false;
        }

        if (requirements.canSort && !field.canSort) {
            return false;
        }

        return true;
    });
}

function convertValue(rawValue, field) {
    if (field?.parseValue) {
        return field.parseValue(rawValue);
    }

    if (rawValue === "true") {
        return true;
    }

    if (rawValue === "false") {
        return false;
    }

    if (rawValue !== "" && !Number.isNaN(Number(rawValue))) {
        return Number(rawValue);
    }

    return rawValue;
}

function toCondition(term, field, value, options) {
    const unescapedNullLiteral = value !== "\\null";
    const isNull =
        value === "null" &&
        unescapedNullLiteral &&
        ["equals", "notEquals"].includes(term.parsedOperator);

    return {
        field: field.path,
        value: isNull
            ? null
            : convertValue(value === "\\null" ? "null" : value, field),
        parsedOperator: term.parsedOperator,
        operatorIsNegated: term.operatorIsNegated,
        operatorIsCaseInsensitive: term.operatorIsCaseInsensitive,
        ignoreNullsOnNotEqual: options.ignoreNullsOnNotEqual,
    };
}

function runCustomMethod(methodMap, name, args, options) {
    const method = getMethodExt(methodMap, name, options.caseSensitive);

    if (!method) {
        return { found: false, value: null };
    }

    const value = method(...args);
    return { found: true, value };
}

function getIncompatibleMethods(methodMap, name, options) {
    if (!methodMap) {
        return [];
    }

    return Object.entries(methodMap)
        .filter(
            ([methodName, value]) =>
                (options.caseSensitive
                    ? methodName === name
                    : methodName.toLowerCase() === name.toLowerCase()) &&
                typeof value !== "function",
        )
        .map(([methodName, value]) => ({
            methodName,
            actualType: typeof value,
        }));
}

export function createSieveProcessor(configuration = {}) {
    const options = { ...DEFAULT_OPTIONS, ...(configuration.options ?? {}) };
    const fieldMap = normalizeFieldMap(configuration.fields);
    const adapter = configuration.adapter;
    const customFilters = configuration.customFilters ?? {};
    const customSorts = configuration.customSorts ?? {};

    if (!adapter) {
        throw new Error("A query adapter is required.");
    }

    if (typeof adapter.applyFilterGroup !== "function") {
        throw new Error(
            "Adapter must implement applyFilterGroup(query, group).",
        );
    }

    if (typeof adapter.applySorts !== "function") {
        throw new Error("Adapter must implement applySorts(query, sorts).");
    }

    if (typeof adapter.applyPagination !== "function") {
        throw new Error(
            "Adapter must implement applyPagination(query, pagination).",
        );
    }

    function apply(modelInput, sourceQuery, execution = {}) {
        const model = parseSieveModel(modelInput ?? {});
        const applyFiltering = execution.applyFiltering ?? true;
        const applySorting = execution.applySorting ?? true;
        const applyPagination = execution.applyPagination ?? true;
        let query = sourceQuery;

        try {
            if (applyFiltering) {
                for (const term of model.filters) {
                    const groups = [];

                    for (const filterName of term.names) {
                        const field = findField(fieldMap, filterName, options, {
                            canFilter: true,
                            canSort: false,
                        });

                        if (field) {
                            for (const value of term.values) {
                                groups.push(
                                    toCondition(term, field, value, options),
                                );
                            }
                            continue;
                        }

                        const customResult = runCustomMethod(
                            customFilters,
                            filterName,
                            [
                                query,
                                term.operator,
                                term.values,
                                execution.context,
                            ],
                            options,
                        );

                        if (customResult.found) {
                            if (customResult.value === undefined) {
                                throw new SieveIncompatibleMethodException(
                                    filterName,
                                    "query-like object",
                                    "undefined",
                                );
                            }

                            query = customResult.value;
                        } else if (options.throwExceptions) {
                            const incompatibles = getIncompatibleMethods(
                                customFilters,
                                filterName,
                                options,
                            );

                            if (incompatibles.length > 0) {
                                throw new SieveIncompatibleMethodException(
                                    filterName,
                                    "function",
                                    incompatibles[0].actualType,
                                );
                            }

                            throw new SieveMethodNotFoundException(filterName);
                        }
                    }

                    if (groups.length > 0) {
                        query = adapter.applyFilterGroup(query, groups);
                    }
                }
            }

            if (applySorting) {
                const resolvedSorts = [];

                for (const sort of model.sorts) {
                    const field = findField(fieldMap, sort.name, options, {
                        canFilter: false,
                        canSort: true,
                    });
                    if (field) {
                        resolvedSorts.push({
                            field: field.path,
                            descending: sort.descending,
                        });
                        continue;
                    }

                    const customResult = runCustomMethod(
                        customSorts,
                        sort.name,
                        [
                            query,
                            resolvedSorts.length > 0,
                            sort.descending,
                            execution.context,
                        ],
                        options,
                    );

                    if (customResult.found) {
                        if (customResult.value === undefined) {
                            throw new SieveIncompatibleMethodException(
                                sort.name,
                                "query-like object",
                                "undefined",
                            );
                        }

                        query = customResult.value;
                    } else if (options.throwExceptions) {
                        const incompatibles = getIncompatibleMethods(
                            customSorts,
                            sort.name,
                            options,
                        );

                        if (incompatibles.length > 0) {
                            throw new SieveIncompatibleMethodException(
                                sort.name,
                                "function",
                                incompatibles[0].actualType,
                            );
                        }

                        throw new SieveMethodNotFoundException(sort.name);
                    }
                }

                if (resolvedSorts.length > 0) {
                    query = adapter.applySorts(query, resolvedSorts);
                }
            }

            if (applyPagination) {
                const page =
                    Number.isInteger(model.page) && model.page > 0
                        ? model.page
                        : 1;
                const rawPageSize = Number.isInteger(model.pageSize)
                    ? model.pageSize
                    : options.defaultPageSize;
                const maxPageSize =
                    options.maxPageSize > 0 ? options.maxPageSize : rawPageSize;

                if (rawPageSize > 0) {
                    query = adapter.applyPagination(query, {
                        page,
                        pageSize: Math.min(rawPageSize, maxPageSize),
                    });
                }
            }

            return query;
        } catch (error) {
            if (options.throwExceptions) {
                if (
                    error instanceof SieveException ||
                    error instanceof SieveMethodNotFoundException ||
                    error instanceof SieveIncompatibleMethodException
                ) {
                    throw error;
                }

                throw new SieveException(error.message, error);
            }

            return query;
        }
    }

    return {
        options,
        fields: fieldMap,
        apply,
        parseModel: parseSieveModel,
    };
}
