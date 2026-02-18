export type Primitive = string | number | boolean | null;

export type ParsedOperator =
  | "equals"
  | "notEquals"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual"
  | "contains"
  | "startsWith"
  | "endsWith";

export interface ParsedFilterTerm {
  raw: string;
  names: string[];
  values: string[];
  operator: string;
  parsedOperator: ParsedOperator;
  operatorIsCaseInsensitive: boolean;
  operatorIsNegated: boolean;
}

export interface ParsedSortTerm {
  raw: string;
  name: string;
  descending: boolean;
}

export interface ParsedSieveModel {
  filters: ParsedFilterTerm[];
  sorts: ParsedSortTerm[];
  page?: number;
  pageSize?: number;
}

export interface FieldMapping {
  name: string;
  path: string;
  canFilter: boolean;
  canSort: boolean;
  parseValue?: (value: string) => unknown;
}

export interface FieldConfig {
  path?: string;
  canFilter?: boolean;
  canSort?: boolean;
  parseValue?: (value: string) => unknown;
}

export type FieldsInput =
  | Array<{
      name: string;
      path?: string;
      canFilter?: boolean;
      canSort?: boolean;
      parseValue?: (value: string) => unknown;
    }>
  | Record<string, string | FieldConfig>;

export interface SieveProcessorOptions {
  caseSensitive?: boolean;
  defaultPageSize?: number;
  maxPageSize?: number;
  throwExceptions?: boolean;
  ignoreNullsOnNotEqual?: boolean;
}

export interface QueryCondition {
  field: string;
  value: unknown;
  parsedOperator: ParsedOperator;
  operatorIsNegated: boolean;
  operatorIsCaseInsensitive: boolean;
  ignoreNullsOnNotEqual: boolean;
}

export interface PaginationInput {
  page: number;
  pageSize: number;
}

export interface QueryAdapter<Q = unknown> {
  applyFilterGroup(query: Q, group: QueryCondition[]): Q;
  applySorts(query: Q, sorts: Array<{ field: string; descending: boolean }>): Q;
  applyPagination(query: Q, pagination: PaginationInput): Q;
}

export type CustomFilterMethods<Q = unknown, C = unknown> = Record<
  string,
  (query: Q, operator: string, values: string[], context?: C) => Q
>;

export type CustomSortMethods<Q = unknown, C = unknown> = Record<
  string,
  (query: Q, useThenBy: boolean, descending: boolean, context?: C) => Q
>;

export interface SieveProcessorExecution<C = unknown> {
  applyFiltering?: boolean;
  applySorting?: boolean;
  applyPagination?: boolean;
  context?: C;
}

export interface SieveProcessorConfiguration<Q = unknown, C = unknown> {
  adapter: QueryAdapter<Q>;
  options?: SieveProcessorOptions;
  fields?: FieldsInput;
  customFilters?: CustomFilterMethods<Q, C>;
  customSorts?: CustomSortMethods<Q, C>;
}

export interface SieveModelInput {
  filters?: string;
  sorts?: string;
  page?: number | string;
  pageSize?: number | string;
}

export interface SieveProcessor<Q = unknown, C = unknown> {
  options: Required<SieveProcessorOptions>;
  fields: FieldMapping[];
  apply(
    modelInput:
      | Partial<SieveModelInput>
      | {
          filters?: string;
          sorts?: string;
          page?: number | string;
          pageSize?: number | string;
        },
    sourceQuery: Q,
    execution?: SieveProcessorExecution<C>,
  ): Q;
  parseModel(modelInput?: Partial<SieveModelInput>): ParsedSieveModel;
}

export function createSieveProcessor<Q = unknown, C = unknown>(
  configuration: SieveProcessorConfiguration<Q, C>,
): SieveProcessor<Q, C>;

export interface SieveMiddlewareOptions<Q = unknown, C = unknown> {
  processor: Pick<SieveProcessor<Q, C>, "apply">;
  queryFactory: (request: unknown, response: unknown) => Q;
  requestModel?: (request: unknown) => Partial<SieveModelInput>;
  assignTo?: string;
}

export function createSieveMiddleware<Q = unknown, C = unknown>(
  options: SieveMiddlewareOptions<Q, C>,
): (
  request: Record<string, unknown>,
  response: unknown,
  next: (error?: unknown) => void,
) => void;

export function createSievePipe<Q = unknown, C = unknown>(input: {
  processor: Pick<SieveProcessor<Q, C>, "apply">;
  execution?: SieveProcessorExecution<C>;
}): (
  model:
    | Partial<SieveModelInput>
    | {
        filters?: string;
        sorts?: string;
        page?: number | string;
        pageSize?: number | string;
      },
  sourceQuery: Q,
  runtimeExecution?: SieveProcessorExecution<C>,
) => Q;

export function parseFilters(filters?: string): ParsedFilterTerm[];
export function parseSorts(sorts?: string): ParsedSortTerm[];
export function parseSieveModel(
  input?: Partial<SieveModelInput>,
): ParsedSieveModel;
