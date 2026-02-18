export function getMethodExt(
  methodMap: Record<string, unknown> | undefined,
  name: string,
  caseSensitive?: boolean,
): ((...args: unknown[]) => unknown) | null;

export function orderByDynamic<Q = unknown>(
  query: Q,
  sorts: Array<{ field: string; descending: boolean }>,
): Q;

export function isNullable(value: unknown): value is null | undefined;
export function isString(value: unknown): value is string;
export function isNumber(value: unknown): value is number;
