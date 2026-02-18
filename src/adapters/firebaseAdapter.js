/**
 * Firebase/Firestore adapter with capability-aware operator mapping.
 */
function unsupported(message, options) {
    if (options.ignoreUnsupported) {
        return false;
    }

    throw new Error(message);
}

function applyFirebaseCondition(query, condition, options, useOr = false) {
    const target =
        useOr && typeof query.orWhere === "function" ? "orWhere" : "where";

    if (condition.operatorIsCaseInsensitive) {
        unsupported(
            `Firebase adapter does not support case-insensitive operator for '${condition.field}'.`,
            options,
        );
        return query;
    }

    if (condition.parsedOperator === "equals") {
        return query[target](condition.field, "==", condition.value);
    }

    if (condition.parsedOperator === "notEquals") {
        return query[target](condition.field, "!=", condition.value);
    }

    if (condition.parsedOperator === "greaterThan") {
        return query[target](condition.field, ">", condition.value);
    }

    if (condition.parsedOperator === "lessThan") {
        return query[target](condition.field, "<", condition.value);
    }

    if (condition.parsedOperator === "greaterThanOrEqual") {
        return query[target](condition.field, ">=", condition.value);
    }

    if (condition.parsedOperator === "lessThanOrEqual") {
        return query[target](condition.field, "<=", condition.value);
    }

    if (condition.parsedOperator === "contains") {
        if (condition.operatorIsNegated) {
            unsupported(
                `Firebase adapter does not support negated contains for '${condition.field}'.`,
                options,
            );
            return query;
        }

        return query[target](
            condition.field,
            "array-contains",
            condition.value,
        );
    }

    if (condition.parsedOperator === "startsWith") {
        if (condition.operatorIsNegated) {
            unsupported(
                `Firebase adapter does not support negated startsWith for '${condition.field}'.`,
                options,
            );
            return query;
        }

        const start = String(condition.value);
        const end = `${start}\uf8ff`;
        return query[target](condition.field, ">=", start)[target](
            condition.field,
            "<=",
            end,
        );
    }

    unsupported(
        `Firebase adapter does not support endsWith for '${condition.field}'.`,
        options,
    );
    return query;
}

export function createFirebaseAdapter(adapterOptions = {}) {
    const options = {
        ignoreUnsupported: false,
        ...adapterOptions,
    };

    return {
        applyFilterGroup(query, group) {
            let next = query;

            if (group.length === 1) {
                return applyFirebaseCondition(next, group[0], options);
            }

            if (typeof query.whereOr === "function") {
                return query.whereOr((orBuilder) => {
                    for (const condition of group) {
                        applyFirebaseCondition(
                            orBuilder,
                            condition,
                            options,
                            true,
                        );
                    }
                });
            }

            unsupported(
                "Firebase query object does not support OR groups; provide a query object with whereOr/orWhere support or use single-name/value filters.",
                options,
            );
            return next;
        },

        applySorts(query, sorts) {
            let next = query;

            for (const sort of sorts) {
                next = next.orderBy(
                    sort.field,
                    sort.descending ? "desc" : "asc",
                );
            }

            return next;
        },

        applyPagination(query, pagination) {
            const offset = (pagination.page - 1) * pagination.pageSize;
            return query.offset(offset).limit(pagination.pageSize);
        },
    };
}
