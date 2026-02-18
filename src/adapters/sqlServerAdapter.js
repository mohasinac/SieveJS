/**
 * SQL Server adapter and SQL text/parameter query-plan compiler.
 */
function quoteSqlServerIdentifier(path) {
    return String(path)
        .split(".")
        .map((part) => `[${part.replace(/]/g, "]]")}]`)
        .join(".");
}

function pushSqlParam(query, value) {
    const index = query.params.length;
    const name = `p${index}`;
    query.params.push({ name, value });
    return `@${name}`;
}

function toLikePattern(condition) {
    const value = String(condition.value);
    if (condition.parsedOperator === "contains") {
        return `%${value}%`;
    }

    if (condition.parsedOperator === "startsWith") {
        return `${value}%`;
    }

    return `%${value}`;
}

function toSqlComparison(condition, query) {
    const column = quoteSqlServerIdentifier(condition.field);

    if (condition.parsedOperator === "equals") {
        if (condition.value === null) {
            return `${column} IS NULL`;
        }

        const parameter = pushSqlParam(query, condition.value);
        return `${column} = ${parameter}`;
    }

    if (condition.parsedOperator === "notEquals") {
        if (condition.value === null) {
            return `${column} IS NOT NULL`;
        }

        const parameter = pushSqlParam(query, condition.value);
        const inequality = `${column} <> ${parameter}`;

        if (condition.ignoreNullsOnNotEqual) {
            return `(${column} IS NOT NULL AND ${inequality})`;
        }

        return inequality;
    }

    if (condition.parsedOperator === "greaterThan") {
        const parameter = pushSqlParam(query, condition.value);
        return `${column} > ${parameter}`;
    }

    if (condition.parsedOperator === "lessThan") {
        const parameter = pushSqlParam(query, condition.value);
        return `${column} < ${parameter}`;
    }

    if (condition.parsedOperator === "greaterThanOrEqual") {
        const parameter = pushSqlParam(query, condition.value);
        return `${column} >= ${parameter}`;
    }

    if (condition.parsedOperator === "lessThanOrEqual") {
        const parameter = pushSqlParam(query, condition.value);
        return `${column} <= ${parameter}`;
    }

    const pattern = toLikePattern(condition);
    const parameter = pushSqlParam(query, pattern);
    const left = condition.operatorIsCaseInsensitive
        ? `LOWER(${column})`
        : column;
    const right = condition.operatorIsCaseInsensitive
        ? `LOWER(${parameter})`
        : parameter;
    const not = condition.operatorIsNegated ? "NOT " : "";

    return `${left} ${not}LIKE ${right}`;
}

export function createSqlServerAdapter() {
    return {
        applyFilterGroup(query, group) {
            const root = query ?? {
                whereClauses: [],
                orderByClauses: [],
                params: [],
            };
            root.whereClauses = root.whereClauses ?? [];
            root.orderByClauses = root.orderByClauses ?? [];
            root.params = root.params ?? [];

            const orClauses = group.map((condition) =>
                toSqlComparison(condition, root),
            );
            root.whereClauses.push(`(${orClauses.join(" OR ")})`);
            return root;
        },

        applySorts(query, sorts) {
            const root = query ?? {
                whereClauses: [],
                orderByClauses: [],
                params: [],
            };
            root.orderByClauses = root.orderByClauses ?? [];

            for (const sort of sorts) {
                root.orderByClauses.push(
                    `${quoteSqlServerIdentifier(sort.field)} ${sort.descending ? "DESC" : "ASC"}`,
                );
            }

            return root;
        },

        applyPagination(query, pagination) {
            const root = query ?? {
                whereClauses: [],
                orderByClauses: [],
                params: [],
            };
            root.page = pagination.page;
            root.pageSize = pagination.pageSize;
            return root;
        },
    };
}

export function buildSqlServerQuery(queryPlan, config) {
    if (!config?.table) {
        throw new Error("buildSqlServerQuery requires config.table.");
    }

    const columns = config.columns ?? "*";
    const table = quoteSqlServerIdentifier(config.table);
    const where = queryPlan.whereClauses?.length
        ? ` WHERE ${queryPlan.whereClauses.join(" AND ")}`
        : "";

    const orderByClauses = queryPlan.orderByClauses ?? [];
    const hasPagination = queryPlan.pageSize > 0;

    let orderBy = "";
    if (orderByClauses.length > 0) {
        orderBy = ` ORDER BY ${orderByClauses.join(", ")}`;
    } else if (hasPagination) {
        orderBy = " ORDER BY (SELECT 1)";
    }

    let pagination = "";
    if (hasPagination) {
        const offset = (queryPlan.page - 1) * queryPlan.pageSize;
        pagination = ` OFFSET ${offset} ROWS FETCH NEXT ${queryPlan.pageSize} ROWS ONLY`;
    }

    return {
        text: `SELECT ${columns} FROM ${table}${where}${orderBy}${pagination};`,
        params: queryPlan.params ?? [],
    };
}
