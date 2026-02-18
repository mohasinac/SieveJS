# SieveJS

[![npm version](https://img.shields.io/npm/v/@mohasinac/sievejs.svg?style=flat-square)](https://www.npmjs.com/package/@mohasinac/sievejs)
[![npm downloads](https://img.shields.io/npm/dm/@mohasinac/sievejs.svg?style=flat-square)](https://www.npmjs.com/package/@mohasinac/sievejs)
[![CI Status](https://img.shields.io/github/actions/workflow/status/mohasinac/SieveJS/ci_publish.yml?style=flat-square)](https://github.com/mohasinac/SieveJS/actions)
[![License](https://img.shields.io/npm/l/@mohasinac/sievejs.svg?style=flat-square)](LICENSE)

SieveJS is a JavaScript-first, ESM-only filtering, sorting, and pagination library inspired by Sieve for .NET.

It applies query logic at the database/query-builder layer (Knex/Mongoose/Prisma/SQL Server/Firebase/Couchbase), instead of in-memory filtering by default.

## Install

```bash
npm install @mohasinac/sievejs
```

📦 **[View on npm](https://www.npmjs.com/package/@mohasinac/sievejs)**

## Quick start (Express)

```js
import express from "express";
import {
    createKnexAdapter,
    createSieveMiddleware,
    SieveProcessorBase,
} from "@mohasinac/sievejs";

const processor = new SieveProcessorBase({
    adapter: createKnexAdapter(),
    autoLoadConfig: true, // reads sieve.config.json / .js / .mjs / .cjs
});

const app = express();

app.get(
    "/posts",
    createSieveMiddleware({
        processor,
        queryFactory: (req) => req.db("posts"),
    }),
    async (req, res, next) => {
        try {
            const rows = await req.sieveQuery;
            res.json(rows);
        } catch (error) {
            next(error);
        }
    },
);
```

## Versioning

- Package: `@mohasinac/sievejs`
- Current version: `1.0.0`
- Version policy: [SemVer](https://semver.org/)
    - `MAJOR`: breaking API changes
    - `MINOR`: backward-compatible features
    - `PATCH`: backward-compatible fixes
- Note: while in `0.x`, minor versions may include changes that would otherwise be major in `1.x`.

## Features

- Sieve DSL parsing (`filters`, `sorts`, `page`, `pageSize`)
- Adapter-based query translation (Knex, Mongoose, Prisma, SQL Server, Firebase, Couchbase)
- Metadata/attribute-style mapping (`Sieve`, `SieveAttribute`, `buildFieldsFromClass`)
- Typed exceptions (`SieveException`, `SieveMethodNotFoundException`, `SieveIncompatibleMethodException`)
- Integration pattern for Express, Next, and custom frameworks
- Pipe helper for non-middleware pipelines

## Usage (Express)

In this example, we use `posts` to show filtering/sorting/pagination.

### 1. Create and configure a processor

```js
import { createKnexAdapter, SieveProcessorBase } from "@mohasinac/sievejs";

const processor = new SieveProcessorBase({
    adapter: createKnexAdapter(),
    autoLoadConfig: true, // reads sieve.config.json / .js / .mjs / .cjs
});
```

### 2. Define which fields are filterable/sortable

#### Option A: Config file (`sieve.config.json`)

```json
{
    "options": {
        "caseSensitive": false,
        "defaultPageSize": 20,
        "maxPageSize": 100,
        "throwExceptions": true
    },
    "fields": {
        "title": { "canFilter": true, "canSort": true },
        "created": {
            "path": "created_at",
            "canFilter": true,
            "canSort": true
        }
    }
}
```

#### Option B: Attributes/metadata in code

```js
import { Sieve, buildFieldsFromClass } from "@mohasinac/sievejs";

class Post {}

Sieve({ canFilter: true, canSort: true })(Post.prototype, "title");
Sieve({ canFilter: true, canSort: true, name: "created" })(
    Post.prototype,
    "createdAt",
);

const fields = buildFieldsFromClass(Post);
```

> In plain JavaScript, decorators are applied as function calls. In TypeScript/Babel you can use decorator syntax if enabled.

### 3. Apply Sieve in your route

```js
import express from "express";
import {
    createSieveMiddleware,
    createKnexAdapter,
    SieveProcessorBase,
} from "@mohasinac/sievejs";

const app = express();

const processor = new SieveProcessorBase({
    adapter: createKnexAdapter(),
    autoLoadConfig: true,
});

app.get(
    "/posts",
    createSieveMiddleware({
        processor,
        queryFactory: (req) => req.db("posts"),
    }),
    async (req, res, next) => {
        try {
            const rows = await req.sieveQuery;
            res.json(rows);
        } catch (error) {
            next(error);
        }
    },
);
```

### 4. Send a request

```http
GET /posts?sorts=likeCount,commentCount,-created&filters=likeCount>10,title@=awesome&page=1&pageSize=10
```

## Add custom sort/filter methods

Custom methods can be provided via processor configuration:

```js
import { createSieveProcessor, createPrismaAdapter } from "@mohasinac/sievejs";

const processor = createSieveProcessor({
    adapter: createPrismaAdapter(),
    fields: {
        title: { canFilter: true, canSort: true },
        created: { canFilter: true, canSort: true },
    },
    customFilters: {
        isNew(query, operator, values) {
            return {
                ...query,
                where: {
                    ...(query.where ?? {}),
                    createdAt: { gte: new Date(values[0]) },
                },
            };
        },
    },
    customSorts: {
        popularity(query, useThenBy, descending) {
            const orderBy = Array.isArray(query.orderBy) ? query.orderBy : [];
            const dir = descending ? "desc" : "asc";
            return {
                ...query,
                orderBy: [
                    ...orderBy,
                    { likeCount: dir },
                    { commentCount: dir },
                ],
            };
        },
    },
});
```

## Configure Sieve

### Processor options

- `caseSensitive`: property-name case sensitivity
- `defaultPageSize`: default page size when none provided
- `maxPageSize`: upper bound for requested page size
- `throwExceptions`: throw typed errors instead of silent fallback
- `ignoreNullsOnNotEqual`: null behavior for `!=`

### Configure via constructor

```js
const processor = new SieveProcessorBase({
    autoLoadConfig: false,
    adapter: createKnexAdapter(),
    options: {
        caseSensitive: false,
        defaultPageSize: 20,
        maxPageSize: 100,
        throwExceptions: true,
        ignoreNullsOnNotEqual: true,
    },
    fields: {
        title: { canFilter: true, canSort: true },
        created: { path: "created_at", canFilter: true, canSort: true },
    },
});
```

## Send a request (DSL reference)

### Query parameters

- `sorts`: comma-delimited ordered list of fields (`-` prefix means descending)
- `filters`: comma-delimited list of `{Name}{Operator}{Value}`
- `page`: page number
- `pageSize`: page size

### OR logic

- OR fields: `(likeCount|commentCount)>10`
- OR values: `title@=new|hot`

### Escaping

- Escaped comma: `title@=some\,title`
- Escaped pipe: `title@=some\|title`
- Literal `null` string: `title==\null`

## Operators

| Operator | Meaning                              |
| -------- | ------------------------------------ |
| `==`     | Equals                               |
| `!=`     | Not equals                           |
| `>`      | Greater than                         |
| `<`      | Less than                            |
| `>=`     | Greater than or equal                |
| `<=`     | Less than or equal                   |
| `@=`     | Contains                             |
| `_=`     | Starts with                          |
| `_-=`    | Ends with                            |
| `!@=`    | Does not contain                     |
| `!_=`    | Does not start with                  |
| `!_-=`   | Does not end with                    |
| `@=*`    | Case-insensitive contains            |
| `_=*`    | Case-insensitive starts with         |
| `_-=*`   | Case-insensitive ends with           |
| `==*`    | Case-insensitive equals              |
| `!=*`    | Case-insensitive not equals          |
| `!@=*`   | Case-insensitive does not contain    |
| `!_=*`   | Case-insensitive does not start with |
| `!_-=*`  | Case-insensitive does not end with   |

## Nested objects/paths

Use mapped paths for nested fields. Example:

```js
const processor = new SieveProcessorBase({
    adapter: createPrismaAdapter(),
    fields: {
        creatorName: { path: "creator.name", canFilter: true, canSort: true },
    },
});
```

Then query with:

```http
GET /posts?filters=creatorName==mohasin
```

## Creating your own DSL/model binding

You can map any request shape to Sieve model format (`filters`, `sorts`, `page`, `pageSize`) in integrations:

```js
import { createSieveIntegration } from "@mohasinac/sievejs";

const runSieve = createSieveIntegration({
    processor,
    requestModel: ({ request }) => ({
        filters: request.body?.where,
        sorts: request.body?.order,
        page: request.body?.p,
        pageSize: request.body?.size,
    }),
    queryFactory: ({ request }) => request.db("posts"),
    execute: ({ query }) => query,
});
```

## Handle Sieve exceptions

With `throwExceptions: true`, typed errors include:

- `SieveMethodNotFoundException`
- `SieveIncompatibleMethodException`
- `SieveException` (wrapper for unexpected runtime errors)

Express error middleware example:

```js
import {
    SieveException,
    SieveIncompatibleMethodException,
    SieveMethodNotFoundException,
} from "@mohasinac/sievejs";

app.use((error, req, res, next) => {
    if (
        error instanceof SieveMethodNotFoundException ||
        error instanceof SieveIncompatibleMethodException ||
        error instanceof SieveException
    ) {
        return res.status(400).json({
            type: error.name,
            message: error.message,
        });
    }

    next(error);
});
```

## Integrations

### Express helper

```js
import { createExpressSieveMiddleware } from "@mohasinac/sievejs/integrations";
```

### Next App Router helper

```js
import { createNextRouteHandler } from "@mohasinac/sievejs/integrations";
```

## Adapters

### Prisma

```js
const processor = new SieveProcessorBase({
    adapter: createPrismaAdapter(),
    fields: {
        title: { canFilter: true, canSort: true },
    },
});

const args = processor.apply(req.query, {});
const rows = await prisma.post.findMany(args);
```

### SQL Server

```js
const plan = processor.apply(req.query, {
    whereClauses: [],
    orderByClauses: [],
    params: [],
});
const { text, params } = buildSqlServerQuery(plan, {
    table: "dbo.Posts",
    columns: "*",
});
```

### Firebase

```js
const processor = new SieveProcessorBase({
    adapter: createFirebaseAdapter(),
    fields: {
        tags: { canFilter: true, canSort: false },
        created: { canFilter: true, canSort: true },
    },
});

const query = processor.apply(req.query, db.collection("posts"));
const snapshot = await query.get();
```

Firebase limitations:

- `contains` maps to `array-contains`
- `startsWith` uses range query (`>= value`, `<= value + "\uf8ff"`)
- `endsWith`, case-insensitive operators, and negated string operators are not supported by Firestore queries

### Couchbase

```js
const plan = processor.apply(req.query, {
    whereClauses: [],
    orderByClauses: [],
    parameters: {},
    parameterIndex: 0,
});

const { statement, parameters } = buildCouchbaseQuery(plan, {
    bucket: "blog",
    scope: "inventory",
    collection: "posts",
});
```

## Pipes

```js
import { createSievePipe } from "@mohasinac/sievejs";

const sievePipe = createSievePipe({ processor });
const query = sievePipe(req.query, db("posts"));
```

## Module API cheat sheet

Use direct imports when you only need specific modules:

- Core: `import { createSieveProcessor, createSieveMiddleware, createSievePipe } from "@mohasinac/sievejs"`
- Attributes + metadata: `import { Sieve, SieveAttribute, buildFieldsFromClass, getSieveMetadata } from "@mohasinac/sievejs/attributes"`
- Exceptions: `import { SieveException } from "@mohasinac/sievejs/exceptions"`
- Extensions: `import { getMethodExt } from "@mohasinac/sievejs/extensions"`
- Models: `import { SieveModel } from "@mohasinac/sievejs/models"`
- Services: `import { SieveProcessorBase } from "@mohasinac/sievejs/services"`
- Pipes: `import { createSievePipe } from "@mohasinac/sievejs/pipes"`
- Integrations: `import { createExpressSieveMiddleware, createNextRouteHandler } from "@mohasinac/sievejs/integrations"`
- Adapters:
    - `import { createKnexAdapter } from "@mohasinac/sievejs/adapters/knex"`
    - `import { createMongooseAdapter } from "@mohasinac/sievejs/adapters/mongoose"`
    - `import { createPrismaAdapter } from "@mohasinac/sievejs/adapters/prisma"`
    - `import { createSqlServerAdapter, buildSqlServerQuery } from "@mohasinac/sievejs/adapters/sqlserver"`
    - `import { createFirebaseAdapter } from "@mohasinac/sievejs/adapters/firebase"`
    - `import { createCouchbaseAdapter, buildCouchbaseQuery } from "@mohasinac/sievejs/adapters/couchbase"`

## Upgrading

### Migrating from .NET Sieve to SieveJS

- Replace attribute annotations with JS metadata (`Sieve(...)`) or `fields` config.
- Replace `IQueryable` pipeline with adapter-native query objects (`Knex`, `Prisma args`, etc.).
- Replace ASP.NET model binding with integration `requestModel` mapping.
- Keep filtering/sorting/pagination at query-builder/database layer.

### Updating within SieveJS

- Follow SemVer tags/releases.
- Read release notes before upgrading minor versions while in `0.x`.
- Re-run `npm test` and `npm pack --dry-run` after upgrades.

## Included samples

See `sample/` for working examples:

- `sample/server.js` (Express + `createExpressSieveMiddleware`)
- `sample/next-route.example.js` (Next Route Handler + `createNextRouteHandler` + Firebase adapter)
- `sample/advanced-modules.example.js` (metadata, attributes, extensions, exceptions, models, pipes, services)
- `sample/sieve.config.json`

## License & Contributing

- License: MIT (`LICENSE`)
- Contributions are welcome via issues and pull requests.
