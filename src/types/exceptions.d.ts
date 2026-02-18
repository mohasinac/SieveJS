export class SieveException extends Error {
  constructor(message: string, innerException?: unknown);
  innerException?: unknown;
}

export class SieveMethodNotFoundException extends SieveException {
  constructor(methodName: string, message?: string);
  methodName: string;
}

export class SieveIncompatibleMethodException extends SieveException {
  constructor(
    methodName: string,
    expectedType: string,
    actualType: string,
    message?: string,
  );
  methodName: string;
  expectedType: string;
  actualType: string;
}
