/**
 * Mongoose adapter that maps Sieve conditions to Mongo query fragments.
 */
function toRegexValue(condition) {
    const escaped = String(condition.value).replace(
        /[.*+?^${}()|[\\]\\]/g,
        "\\$&",
    );
    const body =
        condition.parsedOperator === "contains"
            ? escaped
            : condition.parsedOperator === "startsWith"
              ? `^${escaped}`
              : `${escaped}$`;

    return new RegExp(
        body,
        condition.operatorIsCaseInsensitive ? "i" : undefined,
    );
}

function toMongoCondition(condition) {
    const field = condition.field;

    if (condition.parsedOperator === "equals") {
        return { [field]: condition.value };
    }

    if (condition.parsedOperator === "notEquals") {
        return { [field]: { $ne: condition.value } };
    }

    if (condition.parsedOperator === "greaterThan") {
        return { [field]: { $gt: condition.value } };
    }

    if (condition.parsedOperator === "lessThan") {
        return { [field]: { $lt: condition.value } };
    }

    if (condition.parsedOperator === "greaterThanOrEqual") {
        return { [field]: { $gte: condition.value } };
    }

    if (condition.parsedOperator === "lessThanOrEqual") {
        return { [field]: { $lte: condition.value } };
    }

    const regex = toRegexValue(condition);
    if (condition.operatorIsNegated) {
        return { [field]: { $not: regex } };
    }

    return { [field]: regex };
}

export function createMongooseAdapter() {
    return {
        applyFilterGroup(query, group) {
            const expressions = group.map(toMongoCondition);
            return query.find({ $or: expressions });
        },

        applySorts(query, sorts) {
            const mappedSort = sorts.reduce((carry, sort) => {
                carry[sort.field] = sort.descending ? -1 : 1;
                return carry;
            }, {});

            return query.sort(mappedSort);
        },

        applyPagination(query, pagination) {
            const skip = (pagination.page - 1) * pagination.pageSize;
            return query.skip(skip).limit(pagination.pageSize);
        },
    };
}
