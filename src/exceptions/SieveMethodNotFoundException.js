/**
 * Raised when a configured custom filter/sort method cannot be resolved.
 */
import { SieveException } from "./SieveException.js";

export class SieveMethodNotFoundException extends SieveException {
    constructor(methodName, message) {
        super(message ?? `${methodName} not found.`);
        this.name = "SieveMethodNotFoundException";
        this.methodName = methodName;
    }
}
