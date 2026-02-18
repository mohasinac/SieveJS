# Copilot Instructions for SieveJS

## Project scope

- This repository is JavaScript-first and ESM-only.
- Keep query filtering/sorting/pagination at the database/query-builder layer (never in-memory by default).
- Maintain adapter-driven architecture (`src/adapters/*`) and transport integrations (`src/integrations/*`).

## Coding guidelines

- Prefer small, focused changes.
- Match existing formatting style (4-space indentation, semicolons, double quotes in JS).
- Avoid introducing new dependencies unless necessary.
- Keep public API backward-compatible unless a breaking change is explicitly requested.
- Add JSDoc comments for exported framework/integration APIs.

## Integration pattern

- Reuse `createSieveIntegration` for framework-specific needs.
- Keep framework wrappers thin:
    - Express wrapper should assign query to `request` and call `next()`.
    - Next wrapper should support `(request, routeContext)` and map `searchParams`.

## Typings

- Keep runtime exports and declaration exports aligned.
- When adding exports, update:
    - `src/index.js`
    - `src/index.d.ts`
    - `package.json` `exports` (with both `types` and `default` where applicable)
    - subpath declaration files under `src/types/subpaths/`

## Tests

- Use Node built-in test runner (`node:test`) and `node:assert/strict`.
- Add focused unit tests in `tests/*.test.js` for new behavior.
- Ensure `npm test` passes before finishing.

## Documentation

- Update `README.md` for new public APIs and usage patterns.
- Prefer concise examples for Express and Next integrations.
