/**
 * Prisma adapter that produces `findMany`-compatible query arguments.
 */
function appendAndWhere(existingWhere, clause) {
    if (!existingWhere || Object.keys(existingWhere).length === 0) {
        return clause;
    }

    if (existingWhere.AND && Array.isArray(existingWhere.AND)) {
        return {
            ...existingWhere,
            AND: [...existingWhere.AND, clause],
        };
    }

    return {
        AND: [existingWhere, clause],
    };
}

function toPrismaCondition(condition) {
    const field = condition.field;
    const value = condition.value;

    if (condition.parsedOperator === "equals") {
        return { [field]: value };
    }

    if (condition.parsedOperator === "notEquals") {
        if (value === null) {
            return { [field]: { not: null } };
        }

        if (condition.ignoreNullsOnNotEqual) {
            return {
                AND: [{ [field]: { not: value } }, { [field]: { not: null } }],
            };
        }

        return { [field]: { not: value } };
    }

    if (condition.parsedOperator === "greaterThan") {
        return { [field]: { gt: value } };
    }

    if (condition.parsedOperator === "lessThan") {
        return { [field]: { lt: value } };
    }

    if (condition.parsedOperator === "greaterThanOrEqual") {
        return { [field]: { gte: value } };
    }

    if (condition.parsedOperator === "lessThanOrEqual") {
        return { [field]: { lte: value } };
    }

    const mode = condition.operatorIsCaseInsensitive
        ? "insensitive"
        : undefined;

    if (condition.parsedOperator === "contains") {
        const base = mode
            ? { [field]: { contains: String(value), mode } }
            : { [field]: { contains: String(value) } };

        return condition.operatorIsNegated ? { NOT: base } : base;
    }

    if (condition.parsedOperator === "startsWith") {
        const base = mode
            ? { [field]: { startsWith: String(value), mode } }
            : { [field]: { startsWith: String(value) } };

        return condition.operatorIsNegated ? { NOT: base } : base;
    }

    const base = mode
        ? { [field]: { endsWith: String(value), mode } }
        : { [field]: { endsWith: String(value) } };

    return condition.operatorIsNegated ? { NOT: base } : base;
}

export function createPrismaAdapter() {
    return {
        applyFilterGroup(query, group) {
            const root = query ?? {};
            const where = root.where ?? {};
            const orGroup = { OR: group.map(toPrismaCondition) };

            return {
                ...root,
                where: appendAndWhere(where, orGroup),
            };
        },

        applySorts(query, sorts) {
            const root = query ?? {};
            const existing = Array.isArray(root.orderBy)
                ? root.orderBy
                : root.orderBy
                  ? [root.orderBy]
                  : [];

            const mapped = sorts.map((sort) => ({
                [sort.field]: sort.descending ? "desc" : "asc",
            }));

            return {
                ...root,
                orderBy: [...existing, ...mapped],
            };
        },

        applyPagination(query, pagination) {
            const root = query ?? {};
            const skip = (pagination.page - 1) * pagination.pageSize;

            return {
                ...root,
                skip,
                take: pagination.pageSize,
            };
        },
    };
}
