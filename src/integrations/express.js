/**
 * Express integration adapter.
 */
import { createSieveIntegration } from "./createSieveIntegration.js";

/**
 * Express adapter over the core integration pattern.
 *
 * Assigns the processed query object to `request[assignTo]` and calls `next()`.
 */
export function createExpressSieveMiddleware({
    processor,
    queryFactory,
    requestModel = (request) => request.query,
    assignTo = "sieveQuery",
}) {
    const integration = createSieveIntegration({
        processor,
        requestModel: ({ request }) => requestModel(request),
        queryFactory: ({ request, response }) =>
            queryFactory(request, response),
        executionFactory: ({ request, response }) => ({
            context: { request, response },
        }),
        execute: ({ query, context }) => {
            context.request[assignTo] = query;
        },
    });

    return function sieveMiddleware(request, response, next) {
        Promise.resolve(integration({ request, response, next }))
            .then(() => next())
            .catch(next);
    };
}
