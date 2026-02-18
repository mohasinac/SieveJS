/**
 * Lightweight metadata store and decorator helpers for Sieve attributes.
 */
import { SieveAttribute } from "./SieveAttribute.js";

const metadataStore = new WeakMap();

function ensureMetadata(target) {
    const ctor = typeof target === "function" ? target : target.constructor;
    if (!metadataStore.has(ctor)) {
        metadataStore.set(ctor, new Map());
    }

    return metadataStore.get(ctor);
}

export function defineSieveField(target, propertyKey, attribute) {
    const metadata = ensureMetadata(target);
    const normalized =
        attribute instanceof SieveAttribute
            ? attribute
            : new SieveAttribute(attribute ?? {});

    metadata.set(propertyKey, normalized);
}

export function Sieve(attribute = {}) {
    return function sieveDecorator(target, propertyKey) {
        defineSieveField(target, propertyKey, attribute);
    };
}

export function getSieveMetadata(target) {
    const ctor = typeof target === "function" ? target : target.constructor;
    const metadata = metadataStore.get(ctor);
    if (!metadata) {
        return [];
    }

    return [...metadata.entries()].map(([propertyKey, attribute]) => ({
        propertyKey,
        attribute,
    }));
}

export function buildFieldsFromClass(target) {
    return getSieveMetadata(target).reduce((carry, item) => {
        carry[item.attribute.name ?? item.propertyKey] = {
            path: item.propertyKey,
            canFilter: item.attribute.canFilter,
            canSort: item.attribute.canSort,
        };

        return carry;
    }, {});
}
