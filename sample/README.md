# SieveJS Sample

This sample folder demonstrates the integration design pattern with:

- Express (`createExpressSieveMiddleware`) + Knex/SQL Server
- Next Route Handler (`createNextRouteHandler`) + Firebase/Firestore

## Run

1. Install deps:
    - `npm install express knex mssql`
2. Set env vars as needed:
    - `DB_SERVER`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`
3. Start:
    - `node sample/server.js`
4. Run advanced module examples:
    - `node sample/advanced-modules.example.js`

## Files

- `sample/server.js`: Express sample using `createExpressSieveMiddleware`.
- `sample/next-route.example.js`: Next App Router `GET` handler example using `createNextRouteHandler` + Firebase adapter.
- `sample/advanced-modules.example.js`: Metadata/attributes, extensions, exceptions, models, pipes, and services examples.
- `sample/sieve.config.json`: Shared field/options config.

## Advanced modules sample

`sample/advanced-modules.example.js` includes focused usage examples for:

- metadata + attributes (`Sieve`, `SieveAttribute`, `buildFieldsFromClass`, `getSieveMetadata`)
- models (`SieveModel`, `FilterTerm`, `SortTerm`, `SieveOptions`)
- services (`SieveProcessorBase`, `resolveSieveConfigPath`)
- pipes (`createSievePipe`)
- extensions (`getMethodExt`, `orderByDynamic`, `isNumber`, `isString`)
- exceptions (`SieveMethodNotFoundException`, `SieveIncompatibleMethodException`)

## Copy-paste starter (Next + Firebase)

```js
import { NextResponse } from "next/server";
import {
    createFirebaseAdapter,
    createNextRouteHandler,
    SieveProcessorBase,
} from "@mohasinac/sievejs";

const processor = new SieveProcessorBase({
    adapter: createFirebaseAdapter(),
    fields: {
        title: { canFilter: true, canSort: true },
        tags: { canFilter: true, canSort: false },
        created: { path: "createdAt", canFilter: true, canSort: true },
    },
});

function withFirestore(handler, firestore) {
    return (request, routeContext = {}) =>
        handler(request, {
            ...routeContext,
            firestore,
        });
}

const firestore = globalThis.firestore; // replace with your Firebase Admin init

const nextGetHandler = createNextRouteHandler({
    processor,
    queryFactory: (_request, routeContext) =>
        routeContext.firestore.collection("posts"),
    execute: async (query) => {
        const snapshot = await query.get();
        return NextResponse.json(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
    },
});

export const GET = withFirestore(nextGetHandler, firestore);
```

> Replace `globalThis.firestore` with your Firebase Admin SDK initialization.

## Query example

- `GET /posts?filters=likeCount>10,title@=awesome&sorts=-created&page=1&pageSize=10`

## Configuration

- The server loads `sample/sieve.config.json` automatically through `SieveProcessorBase`.
- You can also pass options and fields directly in code by setting `autoLoadConfig: false` and providing config in constructor.
