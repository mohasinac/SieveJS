/**
 * Request model abstraction for `filters`, `sorts`, `page`, and `pageSize`.
 */
import { parseSieveModel } from "../parser.js";
import { FilterTerm } from "./FilterTerm.js";
import { SortTerm } from "./SortTerm.js";

export class SieveModel {
    constructor(input = {}) {
        this.filters = input.filters;
        this.sorts = input.sorts;
        this.page = input.page;
        this.pageSize = input.pageSize;
    }

    getFiltersParsed() {
        return parseSieveModel(this).filters.map(
            (term) => new FilterTerm(term),
        );
    }

    getSortsParsed() {
        return parseSieveModel(this).sorts.map((term) => new SortTerm(term));
    }

    static from(input = {}) {
        return new SieveModel(input);
    }
}
