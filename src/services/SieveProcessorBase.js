/**
 * Base service that composes config loading and processor creation.
 */
import { createSieveProcessor } from "../processor.js";
import { loadSieveConfig, loadSieveConfigSync } from "./configuration.js";

function mergeConfiguration(runtimeConfiguration, loadedConfiguration) {
    const runtime = runtimeConfiguration ?? {};
    const loaded = loadedConfiguration ?? {};

    return {
        ...loaded,
        ...runtime,
        options: {
            ...(loaded.options ?? {}),
            ...(runtime.options ?? {}),
        },
        fields: {
            ...(loaded.fields ?? {}),
            ...(runtime.fields ?? {}),
        },
        customFilters: {
            ...(loaded.customFilters ?? {}),
            ...(runtime.customFilters ?? {}),
        },
        customSorts: {
            ...(loaded.customSorts ?? {}),
            ...(runtime.customSorts ?? {}),
        },
    };
}

export class SieveProcessorBase {
    constructor(configuration = {}) {
        const {
            autoLoadConfig = true,
            configPath,
            cwd,
            ...runtimeConfiguration
        } = configuration;

        const loaded = autoLoadConfig
            ? loadSieveConfigSync({ cwd, configPath, optional: true })
            : {};

        this.configuration = mergeConfiguration(runtimeConfiguration, loaded);
        this.processor = createSieveProcessor(this.configuration);
    }

    apply(model, sourceQuery, execution) {
        return this.processor.apply(model, sourceQuery, execution);
    }

    parseModel(model) {
        return this.processor.parseModel(model);
    }

    static async fromConfig(configuration = {}) {
        const {
            autoLoadConfig = true,
            configPath,
            cwd,
            ...runtimeConfiguration
        } = configuration;

        const loaded = autoLoadConfig
            ? await loadSieveConfig({ cwd, configPath, optional: true })
            : {};

        return new SieveProcessorBase({
            ...mergeConfiguration(runtimeConfiguration, loaded),
            autoLoadConfig: false,
        });
    }
}
