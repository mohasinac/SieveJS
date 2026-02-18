/**
 * Couchbase adapter and N1QL query-plan compiler.
 */
function quoteCouchbaseIdentifier(path) {
    return String(path)
        .split(".")
        .map((part) => `\`${part.replace(/`/g, "``")}\``)
        .join(".");
}

function pushCouchbaseParam(query, value) {
    const index = query.parameterIndex;
    const name = `p${index}`;
    query.parameterIndex += 1;
    query.parameters[name] = value;
    return `$${name}`;
}

function toN1qlPattern(condition) {
    const value = String(condition.value);

    if (condition.parsedOperator === "contains") {
        return `%${value}%`;
    }

    if (condition.parsedOperator === "startsWith") {
        return `${value}%`;
    }

    return `%${value}`;
}

function toN1qlComparison(condition, query) {
    const field = quoteCouchbaseIdentifier(condition.field);

    if (condition.parsedOperator === "equals") {
        if (condition.value === null) {
            return `${field} IS NULL`;
        }

        const parameter = pushCouchbaseParam(query, condition.value);
        return `${field} = ${parameter}`;
    }

    if (condition.parsedOperator === "notEquals") {
        if (condition.value === null) {
            return `${field} IS NOT NULL`;
        }

        const parameter = pushCouchbaseParam(query, condition.value);
        const inequality = `${field} != ${parameter}`;

        if (condition.ignoreNullsOnNotEqual) {
            return `(${field} IS NOT NULL AND ${inequality})`;
        }

        return inequality;
    }

    if (condition.parsedOperator === "greaterThan") {
        const parameter = pushCouchbaseParam(query, condition.value);
        return `${field} > ${parameter}`;
    }

    if (condition.parsedOperator === "lessThan") {
        const parameter = pushCouchbaseParam(query, condition.value);
        return `${field} < ${parameter}`;
    }

    if (condition.parsedOperator === "greaterThanOrEqual") {
        const parameter = pushCouchbaseParam(query, condition.value);
        return `${field} >= ${parameter}`;
    }

    if (condition.parsedOperator === "lessThanOrEqual") {
        const parameter = pushCouchbaseParam(query, condition.value);
        return `${field} <= ${parameter}`;
    }

    const parameter = pushCouchbaseParam(query, toN1qlPattern(condition));
    const left = condition.operatorIsCaseInsensitive
        ? `LOWER(${field})`
        : field;
    const right = condition.operatorIsCaseInsensitive
        ? `LOWER(${parameter})`
        : parameter;
    const not = condition.operatorIsNegated ? "NOT " : "";
    return `${left} ${not}LIKE ${right}`;
}

export function createCouchbaseAdapter() {
    return {
        applyFilterGroup(query, group) {
            const root = query ?? {
                whereClauses: [],
                orderByClauses: [],
                parameters: {},
                parameterIndex: 0,
            };

            root.whereClauses = root.whereClauses ?? [];
            root.orderByClauses = root.orderByClauses ?? [];
            root.parameters = root.parameters ?? {};
            root.parameterIndex = root.parameterIndex ?? 0;

            const orClause = group
                .map((condition) => toN1qlComparison(condition, root))
                .join(" OR ");
            root.whereClauses.push(`(${orClause})`);
            return root;
        },

        applySorts(query, sorts) {
            const root = query ?? {
                whereClauses: [],
                orderByClauses: [],
                parameters: {},
                parameterIndex: 0,
            };

            root.orderByClauses = root.orderByClauses ?? [];

            for (const sort of sorts) {
                root.orderByClauses.push(
                    `${quoteCouchbaseIdentifier(sort.field)} ${sort.descending ? "DESC" : "ASC"}`,
                );
            }

            return root;
        },

        applyPagination(query, pagination) {
            const root = query ?? {
                whereClauses: [],
                orderByClauses: [],
                parameters: {},
                parameterIndex: 0,
            };

            root.page = pagination.page;
            root.pageSize = pagination.pageSize;
            return root;
        },
    };
}

function quoteBucketPath(config) {
    if (!config?.bucket) {
        throw new Error("buildCouchbaseQuery requires config.bucket.");
    }

    const bucket = quoteCouchbaseIdentifier(config.bucket);
    if (!config.scope || !config.collection) {
        return bucket;
    }

    return `${bucket}.${quoteCouchbaseIdentifier(config.scope)}.${quoteCouchbaseIdentifier(config.collection)}`;
}

export function buildCouchbaseQuery(queryPlan, config = {}) {
    const fields = config.fields ?? "*";
    const source = quoteBucketPath(config);
    const where = queryPlan.whereClauses?.length
        ? ` WHERE ${queryPlan.whereClauses.join(" AND ")}`
        : "";
    const orderBy = queryPlan.orderByClauses?.length
        ? ` ORDER BY ${queryPlan.orderByClauses.join(", ")}`
        : "";

    let pagination = "";
    if (queryPlan.pageSize > 0) {
        const offset = (queryPlan.page - 1) * queryPlan.pageSize;
        pagination = ` LIMIT ${queryPlan.pageSize} OFFSET ${offset}`;
    }

    return {
        statement: `SELECT ${fields} FROM ${source}${where}${orderBy}${pagination};`,
        parameters: queryPlan.parameters ?? {},
    };
}
