import type {
  ParsedSieveModel,
  SieveModelInput,
  SieveProcessor,
  SieveProcessorConfiguration,
  SieveProcessorExecution,
} from "./core.js";

export interface ConfigLoadInput {
  cwd?: string;
  configPath?: string;
  optional?: boolean;
}

export function resolveSieveConfigPath(input?: {
  cwd?: string;
  configPath?: string;
}): string | null;

export function loadSieveConfigSync(
  input?: ConfigLoadInput,
): Partial<SieveProcessorConfiguration>;
export function loadSieveConfig(
  input?: ConfigLoadInput,
): Promise<Partial<SieveProcessorConfiguration>>;

export class SieveProcessorBase<Q = unknown, C = unknown> {
  constructor(
    configuration: Partial<SieveProcessorConfiguration<Q, C>> & {
      autoLoadConfig?: boolean;
      configPath?: string;
      cwd?: string;
    },
  );
  configuration: Partial<SieveProcessorConfiguration<Q, C>>;
  processor: SieveProcessor<Q, C>;
  apply(
    model: Partial<SieveModelInput>,
    sourceQuery: Q,
    execution?: SieveProcessorExecution<C>,
  ): Q;
  parseModel(model: Partial<SieveModelInput>): ParsedSieveModel;
  static fromConfig<Q = unknown, C = unknown>(
    configuration?: Partial<SieveProcessorConfiguration<Q, C>> & {
      autoLoadConfig?: boolean;
      configPath?: string;
      cwd?: string;
    },
  ): Promise<SieveProcessorBase<Q, C>>;
}
