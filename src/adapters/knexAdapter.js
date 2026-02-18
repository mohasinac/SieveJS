/**
 * Knex adapter that translates Sieve conditions into query-builder calls.
 */
function applySingleKnexCondition(builder, condition, useOr) {
    const method = useOr ? "orWhere" : "where";
    const column = condition.field;
    const value = condition.value;

    if (condition.parsedOperator === "equals") {
        if (value === null) {
            const nullMethod = useOr ? "orWhereNull" : "whereNull";
            builder[nullMethod](column);
            return;
        }

        builder[method](column, "=", value);
        return;
    }

    if (condition.parsedOperator === "notEquals") {
        if (value === null) {
            const nullMethod = useOr ? "orWhereNotNull" : "whereNotNull";
            builder[nullMethod](column);
            return;
        }

        builder[method](column, "!=", value);
        return;
    }

    if (
        [
            "greaterThan",
            "lessThan",
            "greaterThanOrEqual",
            "lessThanOrEqual",
        ].includes(condition.parsedOperator)
    ) {
        const operatorMap = {
            greaterThan: ">",
            lessThan: "<",
            greaterThanOrEqual: ">=",
            lessThanOrEqual: "<=",
        };

        builder[method](column, operatorMap[condition.parsedOperator], value);
        return;
    }

    const normalizedValue = String(value);
    const pattern =
        condition.parsedOperator === "contains"
            ? `%${normalizedValue}%`
            : condition.parsedOperator === "startsWith"
              ? `${normalizedValue}%`
              : `%${normalizedValue}`;

    const shouldUseNotLike = condition.operatorIsNegated;

    if (condition.operatorIsCaseInsensitive) {
        const fnName = shouldUseNotLike ? "whereRaw" : "whereRaw";
        const clause = shouldUseNotLike
            ? "LOWER(??) NOT LIKE LOWER(?)"
            : "LOWER(??) LIKE LOWER(?)";

        if (useOr) {
            builder.orWhereRaw(clause, [column, pattern]);
        } else {
            builder[fnName](clause, [column, pattern]);
        }

        return;
    }

    const likeMethod = shouldUseNotLike
        ? useOr
            ? "orWhereNotLike"
            : "whereNotLike"
        : useOr
          ? "orWhereLike"
          : "whereLike";

    if (typeof builder[likeMethod] === "function") {
        builder[likeMethod](column, pattern);
    } else {
        const clause = shouldUseNotLike ? "?? NOT LIKE ?" : "?? LIKE ?";
        if (useOr) {
            builder.orWhereRaw(clause, [column, pattern]);
        } else {
            builder.whereRaw(clause, [column, pattern]);
        }
    }
}

export function createKnexAdapter() {
    return {
        applyFilterGroup(query, group) {
            return query.where((nested) => {
                group.forEach((condition, index) => {
                    applySingleKnexCondition(nested, condition, index > 0);
                });
            });
        },

        applySorts(query, sorts) {
            for (const sort of sorts) {
                query.orderBy(sort.field, sort.descending ? "desc" : "asc");
            }

            return query;
        },

        applyPagination(query, pagination) {
            const offset = (pagination.page - 1) * pagination.pageSize;
            return query.offset(offset).limit(pagination.pageSize);
        },
    };
}
