/**
 * Backward-compatible Express middleware facade.
 */
import { createExpressSieveMiddleware } from "./integrations/express.js";

/**
 * Backward-compatible middleware factory.
 *
 * Internally delegates to the integration-based Express adapter.
 */
export function createSieveMiddleware(options) {
    return createExpressSieveMiddleware(options);
}
