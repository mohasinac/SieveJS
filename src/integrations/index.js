/**
 * Integration module exports.
 */
// Core transport-agnostic integration factory.
export { createSieveIntegration } from "./createSieveIntegration.js";
// Framework adapters.
export { createExpressSieveMiddleware } from "./express.js";
export {
    createNextRouteHandler,
    toSieveModelFromSearchParams,
} from "./next.js";
