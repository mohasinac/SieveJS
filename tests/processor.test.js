/**
 * Processor behavior tests.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
    createSieveProcessor,
    SieveMethodNotFoundException,
} from "../src/index.js";

function createRecordingAdapter() {
    return {
        filterGroups: [],
        sorts: [],
        pagination: [],
        applyFilterGroup(query, group) {
            this.filterGroups.push(group);
            query.steps.push("filter");
            return query;
        },
        applySorts(query, sorts) {
            this.sorts.push(sorts);
            query.steps.push("sort");
            return query;
        },
        applyPagination(query, pagination) {
            this.pagination.push(pagination);
            query.steps.push("paginate");
            return query;
        },
    };
}

test("processor applies mapped fields, custom filter, sorting, and pagination", () => {
    const adapter = createRecordingAdapter();
    const seenContexts = [];

    const processor = createSieveProcessor({
        adapter,
        options: {
            defaultPageSize: 20,
            maxPageSize: 50,
        },
        fields: {
            title: { path: "title_col", canFilter: true },
            age: { path: "age_col", canFilter: true, parseValue: Number },
            created: { path: "created_col", canSort: true },
        },
        customFilters: {
            custom(query, operator, values, context) {
                seenContexts.push(context);
                query.custom = { operator, values };
                return query;
            },
        },
    });

    const query = { steps: [] };
    const result = processor.apply(
        {
            filters: "title@=john,age>=30,custom==x",
            sorts: "-created",
            page: 2,
            pageSize: 100,
        },
        query,
        { context: { tenant: "acme" } },
    );

    assert.equal(result, query);
    assert.deepEqual(query.steps, ["filter", "filter", "sort", "paginate"]);

    assert.equal(adapter.filterGroups.length, 2);
    assert.equal(adapter.filterGroups[0][0].field, "title_col");
    assert.equal(adapter.filterGroups[0][0].parsedOperator, "contains");
    assert.equal(adapter.filterGroups[1][0].value, 30);

    assert.deepEqual(adapter.sorts[0], [
        { field: "created_col", descending: true },
    ]);
    assert.deepEqual(adapter.pagination[0], { page: 2, pageSize: 50 });
    assert.deepEqual(seenContexts, [{ tenant: "acme" }]);
    assert.deepEqual(query.custom, { operator: "==", values: ["x"] });
});

test("processor throws when unknown filter and throwExceptions=true", () => {
    const processor = createSieveProcessor({
        adapter: createRecordingAdapter(),
        options: { throwExceptions: true },
        fields: {
            title: { path: "title_col", canFilter: true },
        },
    });

    assert.throws(
        () => processor.apply({ filters: "missing==x" }, { steps: [] }),
        (error) => {
            assert.ok(error instanceof SieveMethodNotFoundException);
            assert.equal(error.methodName, "missing");
            return true;
        },
    );
});
