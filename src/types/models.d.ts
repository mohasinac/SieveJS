import type {
  ParsedFilterTerm,
  ParsedSortTerm,
  SieveModelInput,
  SieveProcessorOptions,
} from "./core.js";

export const FilterOperator: {
  EQUALS: "equals";
  NOT_EQUALS: "notEquals";
  GREATER_THAN: "greaterThan";
  LESS_THAN: "lessThan";
  GREATER_THAN_OR_EQUAL: "greaterThanOrEqual";
  LESS_THAN_OR_EQUAL: "lessThanOrEqual";
  CONTAINS: "contains";
  STARTS_WITH: "startsWith";
  ENDS_WITH: "endsWith";
};

export class FilterTerm {
  constructor(value: ParsedFilterTerm);
}

export class SortTerm {
  constructor(value: ParsedSortTerm);
}

export class SieveModel {
  constructor(input?: Partial<SieveModelInput>);
  filters?: string;
  sorts?: string;
  page?: number | string;
  pageSize?: number | string;
  getFiltersParsed(): FilterTerm[];
  getSortsParsed(): SortTerm[];
  static from(input?: Partial<SieveModelInput>): SieveModel;
}

export class SieveOptions {
  constructor(options?: SieveProcessorOptions);
  caseSensitive: boolean;
  defaultPageSize: number;
  maxPageSize: number;
  throwExceptions: boolean;
  ignoreNullsOnNotEqual: boolean;
}
