/**
 * Parser behavior tests.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { parseFilters, parseSorts, parseSieveModel } from "../src/index.js";

test("parseFilters handles escaped values and grouped names", () => {
    const [first, second] = parseFilters(
        "(title|name)@=*jo\\|hn,status==active\\,user",
    );

    assert.deepEqual(first.names, ["title", "name"]);
    assert.equal(first.parsedOperator, "contains");
    assert.equal(first.operatorIsCaseInsensitive, true);
    assert.deepEqual(first.values, ["jo|hn"]);

    assert.deepEqual(second.names, ["status"]);
    assert.equal(second.parsedOperator, "equals");
    assert.deepEqual(second.values, ["active,user"]);
});

test("parseSorts deduplicates and tracks descending flag", () => {
    const parsed = parseSorts("-created,title,-created");

    assert.equal(parsed.length, 2);
    assert.deepEqual(parsed[0], {
        raw: "-created",
        name: "created",
        descending: true,
    });
    assert.deepEqual(parsed[1], {
        raw: "title",
        name: "title",
        descending: false,
    });
});

test("parseSieveModel parses page and pageSize numbers", () => {
    const model = parseSieveModel({
        filters: "age>=21",
        sorts: "-created",
        page: "3",
        pageSize: "25",
    });

    assert.equal(model.page, 3);
    assert.equal(model.pageSize, 25);
    assert.equal(model.filters.length, 1);
    assert.equal(model.sorts.length, 1);
});
