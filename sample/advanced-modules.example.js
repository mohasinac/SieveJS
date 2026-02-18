import path from "node:path";
import { fileURLToPath } from "node:url";
import {
    Sieve,
    SieveAttribute,
    buildFieldsFromClass,
    createKnexAdapter,
    createSievePipe,
    FilterTerm,
    getMethodExt,
    getSieveMetadata,
    isNumber,
    isString,
    orderByDynamic,
    parseSieveModel,
    resolveSieveConfigPath,
    SieveIncompatibleMethodException,
    SieveMethodNotFoundException,
    SieveModel,
    SieveOptions,
    SieveProcessorBase,
    SortTerm,
} from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PostEntity {
    constructor() {
        this.title = "";
        this.createdAt = "";
        this.likeCount = 0;
    }
}

Sieve(new SieveAttribute({ canFilter: true, canSort: true }))(
    PostEntity.prototype,
    "title",
);
Sieve({ canFilter: true, canSort: true, name: "created" })(
    PostEntity.prototype,
    "createdAt",
);
Sieve({ canFilter: true, canSort: true })(PostEntity.prototype, "likeCount");

const fields = buildFieldsFromClass(PostEntity);
const metadata = getSieveMetadata(PostEntity);

console.log("Metadata/Attributes: ", {
    metadataCount: metadata.length,
    fieldNames: Object.keys(fields),
});

const model = SieveModel.from({
    filters: "title@=js,likeCount>=10",
    sorts: "-created",
    page: 1,
    pageSize: 10,
});

const parsed = parseSieveModel(model);
const firstFilterTerm = new FilterTerm(parsed.filters[0]);
const firstSortTerm = new SortTerm(parsed.sorts[0]);
const options = new SieveOptions({
    throwExceptions: true,
    defaultPageSize: 20,
});

console.log("Models: ", {
    firstFilter: firstFilterTerm,
    firstSort: firstSortTerm,
    options,
});

const processor = new SieveProcessorBase({
    autoLoadConfig: false,
    adapter: createKnexAdapter(),
    fields,
    options: {
        throwExceptions: true,
        defaultPageSize: 10,
    },
});

const queryLike = {
    steps: [],
    where(...args) {
        this.steps.push(["where", ...args]);
        if (typeof args[0] === "function") {
            args[0](this);
        }
        return this;
    },
    whereRaw(sql, bindings) {
        this.steps.push(["whereRaw", sql, bindings]);
        return this;
    },
    whereLike(column, value) {
        this.steps.push(["whereLike", column, value]);
        return this;
    },
    whereNotLike(column, value) {
        this.steps.push(["whereNotLike", column, value]);
        return this;
    },
    whereNull(column) {
        this.steps.push(["whereNull", column]);
        return this;
    },
    whereNotNull(column) {
        this.steps.push(["whereNotNull", column]);
        return this;
    },
    orWhere(column, operator, value) {
        this.steps.push(["orWhere", column, operator, value]);
        return this;
    },
    orWhereRaw(sql, bindings) {
        this.steps.push(["orWhereRaw", sql, bindings]);
        return this;
    },
    orWhereLike(column, value) {
        this.steps.push(["orWhereLike", column, value]);
        return this;
    },
    orWhereNotLike(column, value) {
        this.steps.push(["orWhereNotLike", column, value]);
        return this;
    },
    orWhereNull(column) {
        this.steps.push(["orWhereNull", column]);
        return this;
    },
    orWhereNotNull(column) {
        this.steps.push(["orWhereNotNull", column]);
        return this;
    },
    orderBy(column, direction) {
        this.steps.push(["orderBy", column, direction]);
        return this;
    },
    offset(value) {
        this.steps.push(["offset", value]);
        return this;
    },
    limit(value) {
        this.steps.push(["limit", value]);
        return this;
    },
};

const sievePipe = createSievePipe({ processor });
const pipeResult = sievePipe(model, queryLike);

console.log("Pipes/Services: ", {
    appliedSteps: pipeResult.steps.length,
    configPath: resolveSieveConfigPath({ cwd: __dirname }),
});

const extensionMethod = getMethodExt(
    {
        RankByLikes: (query) => query,
    },
    "rankbylikes",
    false,
);

const sortedRows = orderByDynamic(
    {
        rows: [
            { id: 2, createdAt: 200 },
            { id: 1, createdAt: 100 },
        ],
        orderBy(field, direction) {
            const copy = [...this.rows].sort((a, b) => a[field] - b[field]);
            this.rows = direction === "desc" ? copy.reverse() : copy;
            return this;
        },
    },
    [{ field: "createdAt", descending: true }],
).rows;

console.log("Extensions: ", {
    hasRankMethod: typeof extensionMethod === "function",
    isNumberCheck: isNumber(42),
    isStringCheck: isString("sieve"),
    topSortedId: sortedRows[0]?.id,
});

try {
    processor.apply(
        {
            filters: "missingField==x",
        },
        { ...queryLike, steps: [] },
    );
} catch (error) {
    const isExpected =
        error instanceof SieveMethodNotFoundException ||
        error instanceof SieveIncompatibleMethodException;

    console.log("Exceptions: ", {
        errorType: error?.name,
        expected: isExpected,
    });
}
