/**
 * Utilities for resolving user-provided custom methods by name.
 */
export function getMethodExt(methodMap, name, caseSensitive = false) {
    if (!methodMap) {
        return null;
    }

    const entries = Object.entries(methodMap);
    const found = entries.find(([methodName, value]) =>
        caseSensitive
            ? methodName === name && typeof value === "function"
            : methodName.toLowerCase() === name.toLowerCase() &&
              typeof value === "function",
    );

    return found?.[1] ?? null;
}
