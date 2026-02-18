/**
 * Raised when a custom method exists but has an incompatible shape.
 */
import { SieveException } from "./SieveException.js";

export class SieveIncompatibleMethodException extends SieveException {
    constructor(methodName, expectedType, actualType, message) {
        super(
            message ??
                `${methodName} failed. Expected custom method return type '${expectedType}' but got '${actualType}'.`,
        );
        this.name = "SieveIncompatibleMethodException";
        this.methodName = methodName;
        this.expectedType = expectedType;
        this.actualType = actualType;
    }
}
