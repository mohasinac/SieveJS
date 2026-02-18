/**
 * Config resolution and loading for sieve.config.* files.
 */
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const DEFAULT_NAMES = [
    "sieve.config.json",
    "sieve.config.js",
    "sieve.config.mjs",
    "sieve.config.cjs",
];

export function resolveSieveConfigPath({
    cwd = process.cwd(),
    configPath,
} = {}) {
    if (configPath) {
        return path.isAbsolute(configPath)
            ? configPath
            : path.resolve(cwd, configPath);
    }

    for (const fileName of DEFAULT_NAMES) {
        const candidate = path.resolve(cwd, fileName);
        if (existsSync(candidate)) {
            return candidate;
        }
    }

    return null;
}

function normalizeLoadedConfig(payload) {
    if (!payload) {
        return {};
    }

    return payload.default && typeof payload.default === "object"
        ? payload.default
        : payload;
}

export function loadSieveConfigSync({
    cwd = process.cwd(),
    configPath,
    optional = true,
} = {}) {
    const resolved = resolveSieveConfigPath({ cwd, configPath });

    if (!resolved) {
        if (optional) {
            return {};
        }

        throw new Error("No sieve.config file found.");
    }

    if (!resolved.endsWith(".json")) {
        throw new Error(
            "Synchronous config loading supports only JSON files. Use loadSieveConfig for JS/MJS/CJS.",
        );
    }

    const text = readFileSync(resolved, "utf8");
    return normalizeLoadedConfig(JSON.parse(text));
}

export async function loadSieveConfig({
    cwd = process.cwd(),
    configPath,
    optional = true,
} = {}) {
    const resolved = resolveSieveConfigPath({ cwd, configPath });

    if (!resolved) {
        if (optional) {
            return {};
        }

        throw new Error("No sieve.config file found.");
    }

    if (resolved.endsWith(".json")) {
        const text = readFileSync(resolved, "utf8");
        return normalizeLoadedConfig(JSON.parse(text));
    }

    const loaded = await import(pathToFileURL(resolved).href);
    return normalizeLoadedConfig(loaded);
}
