import type { QueryAdapter } from "./core.js";

export interface SqlServerQueryPlan {
  whereClauses: string[];
  orderByClauses: string[];
  params: Array<{ name: string; value: unknown }>;
  page?: number;
  pageSize?: number;
}

export function createSqlServerAdapter(): QueryAdapter<SqlServerQueryPlan>;
export function buildSqlServerQuery(
  queryPlan: SqlServerQueryPlan,
  config: { table: string; columns?: string },
): { text: string; params: Array<{ name: string; value: unknown }> };

export interface CouchbaseQueryPlan {
  whereClauses: string[];
  orderByClauses: string[];
  parameters: Record<string, unknown>;
  parameterIndex: number;
  page?: number;
  pageSize?: number;
}

export function createCouchbaseAdapter(): QueryAdapter<CouchbaseQueryPlan>;
export function buildCouchbaseQuery(
  queryPlan: CouchbaseQueryPlan,
  config?: {
    bucket: string;
    scope?: string;
    collection?: string;
    fields?: string;
  },
): { statement: string; parameters: Record<string, unknown> };

export function createPrismaAdapter(): QueryAdapter<Record<string, unknown>>;
export function createKnexAdapter(): QueryAdapter<any>;
export function createMongooseAdapter(): QueryAdapter<any>;
export function createFirebaseAdapter(adapterOptions?: {
  ignoreUnsupported?: boolean;
}): QueryAdapter<any>;
