import { NextResponse } from "next/server";
import {
    createFirebaseAdapter,
    createNextRouteHandler,
    SieveProcessorBase,
} from "@mohasinac/sievejs";

const firestore = globalThis.firestore;

function withFirestore(handler, db) {
    return function routeWithFirestore(request, routeContext = {}) {
        return handler(request, {
            ...routeContext,
            firestore: db,
        });
    };
}

const processor = new SieveProcessorBase({
    adapter: createFirebaseAdapter(),
    autoLoadConfig: false,
    options: {
        throwExceptions: true,
    },
    fields: {
        id: { canFilter: true, canSort: true },
        title: { canFilter: true, canSort: true },
        tags: { canFilter: true, canSort: false },
        created: { path: "createdAt", canFilter: true, canSort: true },
    },
});

const nextGetHandler = createNextRouteHandler({
    processor,
    queryFactory: (_request, routeContext) =>
        routeContext.firestore.collection("posts"),
    execute: async (query) => {
        const snapshot = await query.get();
        const rows = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        return NextResponse.json(rows);
    },
});

export const GET = withFirestore(nextGetHandler, firestore);
