import type { FieldConfig } from "./core.js";

export class SieveAttribute {
  constructor(input?: {
    canFilter?: boolean;
    canSort?: boolean;
    name?: string;
  });
  canFilter: boolean;
  canSort: boolean;
  name?: string;
}

export function defineSieveField(
  target: object | Function,
  propertyKey: string,
  attribute?:
    | SieveAttribute
    | { canFilter?: boolean; canSort?: boolean; name?: string },
): void;

export function Sieve(attribute?: {
  canFilter?: boolean;
  canSort?: boolean;
  name?: string;
}): (target: object | Function, propertyKey: string) => void;

export function getSieveMetadata(
  target: object | Function,
): Array<{ propertyKey: string; attribute: SieveAttribute }>;

export function buildFieldsFromClass(
  target: object | Function,
): Record<string, FieldConfig>;
