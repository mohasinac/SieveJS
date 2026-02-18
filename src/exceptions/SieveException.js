/**
 * Base exception type for Sieve runtime and integration errors.
 */
export class SieveException extends Error {
    constructor(message, innerException) {
        super(message);
        this.name = "SieveException";
        this.innerException = innerException;
    }
}
