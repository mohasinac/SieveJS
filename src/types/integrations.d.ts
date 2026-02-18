import type {
  SieveModelInput,
  SieveProcessor,
  SieveProcessorExecution,
} from "./core.js";

export interface SieveIntegrationContext {
  request?: unknown;
  response?: unknown;
  routeContext?: unknown;
  [key: string]: unknown;
}

export interface CreateSieveIntegrationInput<Q = unknown, C = unknown> {
  processor: Pick<SieveProcessor<Q, C>, "apply">;
  requestModel?: (context: SieveIntegrationContext) => Partial<SieveModelInput>;
  queryFactory: (context: SieveIntegrationContext) => Q;
  execute: (input: {
    query: Q;
    model: Partial<SieveModelInput>;
    context: SieveIntegrationContext;
    sourceQuery: Q;
  }) => unknown | Promise<unknown>;
  executionFactory?: (
    context: SieveIntegrationContext,
  ) => SieveProcessorExecution<C>;
  onError?: (
    error: unknown,
    context: SieveIntegrationContext,
  ) => unknown | Promise<unknown>;
}

export function createSieveIntegration<Q = unknown, C = unknown>(
  input: CreateSieveIntegrationInput<Q, C>,
): (context?: SieveIntegrationContext) => Promise<unknown>;

export interface ExpressSieveMiddlewareInput<Q = unknown, C = unknown> {
  processor: Pick<SieveProcessor<Q, C>, "apply">;
  queryFactory: (request: unknown, response: unknown) => Q;
  requestModel?: (request: unknown) => Partial<SieveModelInput>;
  assignTo?: string;
}

export function createExpressSieveMiddleware<Q = unknown, C = unknown>(
  input: ExpressSieveMiddlewareInput<Q, C>,
): (
  request: Record<string, unknown>,
  response: unknown,
  next: (error?: unknown) => void,
) => void;

export interface NextRouteHandlerInput<
  Q = unknown,
  C = unknown,
  TResult = unknown,
> {
  processor: Pick<SieveProcessor<Q, C>, "apply">;
  queryFactory: (request: unknown, routeContext: unknown) => Q;
  execute: (
    query: Q,
    context: {
      request: unknown;
      routeContext: unknown;
      model: Partial<SieveModelInput>;
    },
  ) => TResult | Promise<TResult>;
  requestModel?: (request: unknown) => Partial<SieveModelInput>;
  executionFactory?: (
    request: unknown,
    routeContext: unknown,
  ) => SieveProcessorExecution<C>;
  onError?: (
    error: unknown,
    context: { request: unknown; routeContext: unknown },
  ) => TResult | Promise<TResult>;
}

export function toSieveModelFromSearchParams(searchParams: {
  get(name: string): string | null;
}): Partial<SieveModelInput>;

export function createNextRouteHandler<
  Q = unknown,
  C = unknown,
  TResult = unknown,
>(
  input: NextRouteHandlerInput<Q, C, TResult>,
): (request: unknown, routeContext: unknown) => Promise<TResult>;
