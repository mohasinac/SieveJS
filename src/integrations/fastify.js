/**
 * Fastify preHandler integration adapter.
 */
import { createSieveIntegration } from "./createSieveIntegration.js";

/**
 * Fastify preHandler adapter over the core integration pattern.
 *
 * Assigns the processed query object to `request[assignTo]` so the
 * downstream route handler can await it. Call this as a `preHandler`
 * on individual routes or register it globally via `addHook`.
 */
export function createFastifySievePreHandler({
    processor,
    queryFactory,
    requestModel = (request) => request.query,
    assignTo = "sieveQuery",
}) {
    const integration = createSieveIntegration({
        processor,
        requestModel: ({ request }) => requestModel(request),
        queryFactory: ({ request, reply }) => queryFactory(request, reply),
        executionFactory: ({ request, reply }) => ({
            context: { request, reply },
        }),
        execute: ({ query, context }) => {
            context.request[assignTo] = query;
        },
    });

    return async function sievePreHandler(request, reply) {
        await integration({ request, reply });
    };
}
