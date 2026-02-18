import express from "express";
import knex from "knex";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
    createExpressSieveMiddleware,
    createKnexAdapter,
    SieveProcessorBase,
} from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = knex({
    client: "mssql",
    connection: {
        server: process.env.DB_SERVER ?? "localhost",
        user: process.env.DB_USER ?? "sa",
        password: process.env.DB_PASSWORD ?? "YourStrong@Passw0rd",
        database: process.env.DB_NAME ?? "SieveSample",
        options: {
            trustServerCertificate: true,
        },
    },
});

const processor = new SieveProcessorBase({
    cwd: __dirname,
    adapter: createKnexAdapter(),
    autoLoadConfig: true,
});

const app = express();

app.get(
    "/posts",
    createExpressSieveMiddleware({
        processor,
        queryFactory: () => db("posts"),
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

app.get("/health", (req, res) => {
    res.json({ ok: true });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
    console.log(`Sieve JS sample listening on :${port}`);
});
