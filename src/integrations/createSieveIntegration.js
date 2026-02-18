/**
 * Transport-agnostic integration orchestration.
 */
/**
 * Creates a transport-agnostic Sieve integration runner.
 *
 * Pattern:
 * - requestModel(context) extracts sieve inputs
 * - queryFactory(context) creates source query/args
 * - processor.apply(...) transforms query
 * - execute(...) performs framework-specific side effects or returns result
 */
export function createSieveIntegration({
    processor,
    requestModel,
    queryFactory,
    execute,
    executionFactory,
    onError,
}) {
    if (!processor || typeof processor.apply !== "function") {
        throw new Error("A valid processor instance is required.");
    }

    if (typeof queryFactory !== "function") {
        throw new Error("queryFactory(context) must be provided.");
    }

    if (typeof execute !== "function") {
        throw new Error(
            "execute({ query, model, context, sourceQuery }) must be provided.",
        );
    }

    /**
     * Runs the integration for a single request context.
     */
    return async function runSieveIntegration(context = {}) {
        try {
            const model =
                typeof requestModel === "function"
                    ? requestModel(context)
                    : (context?.request?.query ?? {});
            const sourceQuery = queryFactory(context);
            const execution =
                typeof executionFactory === "function"
                    ? executionFactory(context)
                    : { context };
            const query = processor.apply(model, sourceQuery, execution);

            return await execute({ query, model, context, sourceQuery });
        } catch (error) {
            if (typeof onError === "function") {
                return onError(error, context);
            }

            throw error;
        }
    };
}
