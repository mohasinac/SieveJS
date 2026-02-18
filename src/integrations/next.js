/**
 * Next.js Route Handler integration adapter.
 */
import { createSieveIntegration } from "./createSieveIntegration.js";

/**
 * Converts Next.js URLSearchParams into a Sieve model shape.
 */
export function toSieveModelFromSearchParams(searchParams) {
    const getValue = (key) => {
        const value = searchParams?.get?.(key);
        return value ?? undefined;
    };

    return {
        filters: getValue("filters"),
        sorts: getValue("sorts"),
        page: getValue("page"),
        pageSize: getValue("pageSize"),
    };
}

/**
 * Next.js Route Handler adapter over the core integration pattern.
 *
 * The returned function signature matches App Router handlers:
 * `(request, routeContext) => Promise<ResponseLike>`.
 */
export function createNextRouteHandler({
    processor,
    queryFactory,
    execute,
    requestModel = (request) =>
        toSieveModelFromSearchParams(request?.nextUrl?.searchParams),
    executionFactory,
    onError,
}) {
    const integration = createSieveIntegration({
        processor,
        requestModel: ({ request }) => requestModel(request),
        queryFactory: ({ request, routeContext }) =>
            queryFactory(request, routeContext),
        execute: ({ query, context, model }) =>
            execute(query, {
                request: context.request,
                routeContext: context.routeContext,
                model,
            }),
        executionFactory:
            typeof executionFactory === "function"
                ? ({ request, routeContext }) =>
                      executionFactory(request, routeContext)
                : ({ request, routeContext }) => ({
                      context: { request, routeContext },
                  }),
        onError:
            typeof onError === "function"
                ? (error, { request, routeContext }) =>
                      onError(error, { request, routeContext })
                : undefined,
    });

    return async function sieveRouteHandler(request, routeContext) {
        return integration({ request, routeContext });
    };
}
