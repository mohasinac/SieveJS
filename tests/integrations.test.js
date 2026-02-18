/**
 * Integration behavior tests.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
    createExpressSieveMiddleware,
    createNextRouteHandler,
    createSieveIntegration,
    toSieveModelFromSearchParams,
} from "../src/index.js";

function createProcessor() {
    return {
        apply(model, sourceQuery, execution) {
            return {
                ...sourceQuery,
                model,
                execution,
            };
        },
    };
}

test("createSieveIntegration composes model/query/execution", async () => {
    const integration = createSieveIntegration({
        processor: createProcessor(),
        requestModel: (context) => context.requestModel,
        queryFactory: () => ({ base: true }),
        executionFactory: (context) => ({ context: context.meta }),
        execute: ({ query }) => query,
    });

    const result = await integration({
        requestModel: { filters: "title@=a" },
        meta: { scope: "unit" },
    });

    assert.equal(result.base, true);
    assert.deepEqual(result.model, { filters: "title@=a" });
    assert.deepEqual(result.execution, { context: { scope: "unit" } });
});

test("createExpressSieveMiddleware assigns sieve query and calls next", async () => {
    const middleware = createExpressSieveMiddleware({
        processor: createProcessor(),
        queryFactory: () => ({ source: "express" }),
    });

    const request = { query: { filters: "id==1" } };
    const response = {};

    await new Promise((resolve, reject) => {
        middleware(request, response, (error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });

    assert.equal(request.sieveQuery.source, "express");
    assert.deepEqual(request.sieveQuery.model, { filters: "id==1" });
    assert.ok(request.sieveQuery.execution?.context?.request);
});

test("createNextRouteHandler processes Next search params model", async () => {
    const handler = createNextRouteHandler({
        processor: createProcessor(),
        queryFactory: () => ({ source: "next" }),
        execute: (query) => query,
    });

    const request = {
        nextUrl: {
            searchParams: new URLSearchParams(
                "filters=title@=x&page=2&pageSize=10",
            ),
        },
    };

    const result = await handler(request, { params: { id: "1" } });

    assert.equal(result.source, "next");
    assert.equal(result.model.filters, "title@=x");
    assert.equal(result.model.page, "2");
    assert.equal(result.model.pageSize, "10");
});

test("toSieveModelFromSearchParams extracts sieve keys", () => {
    const model = toSieveModelFromSearchParams(
        new URLSearchParams("sorts=-created&filters=name@=a"),
    );

    assert.deepEqual(model, {
        filters: "name@=a",
        sorts: "-created",
        page: undefined,
        pageSize: undefined,
    });
});
