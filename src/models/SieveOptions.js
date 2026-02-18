/**
 * Runtime processor options with safe defaults.
 */
export class SieveOptions {
    constructor(options = {}) {
        this.caseSensitive = options.caseSensitive ?? false;
        this.defaultPageSize = options.defaultPageSize ?? 0;
        this.maxPageSize = options.maxPageSize ?? 0;
        this.throwExceptions = options.throwExceptions ?? false;
        this.ignoreNullsOnNotEqual = options.ignoreNullsOnNotEqual ?? true;
    }
}
