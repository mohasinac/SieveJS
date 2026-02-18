/**
 * Pipe helper that applies Sieve processing in non-middleware pipelines.
 */
export function createSievePipe({ processor, execution } = {}) {
    if (!processor || typeof processor.apply !== "function") {
        throw new Error("createSievePipe requires a processor with apply().");
    }

    return function sievePipe(model, sourceQuery, runtimeExecution = {}) {
        return processor.apply(model, sourceQuery, {
            ...(execution ?? {}),
            ...(runtimeExecution ?? {}),
        });
    };
}
