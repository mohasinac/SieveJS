/**
 * Generic helper for applying ordered fields to query-builder objects.
 */
export function orderByDynamic(query, sorts) {
    if (!query || typeof query.orderBy !== "function") {
        return query;
    }

    for (const sort of sorts) {
        query = query.orderBy(sort.field, sort.descending ? "desc" : "asc");
    }

    return query;
}
