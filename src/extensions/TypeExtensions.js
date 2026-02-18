/**
 * Narrowing helpers used in adapters and custom extension points.
 */
export function isNullable(value) {
    return value === null || value === undefined;
}

export function isString(value) {
    return typeof value === "string";
}

export function isNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}
