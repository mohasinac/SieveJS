/**
 * Sieve DSL parser for filters/sorts/pagination model inputs.
 */
import { ESCAPE_CHAR, OPERATORS } from "./constants.js";

function isEscaped(input, index) {
    let slashCount = 0;
    let cursor = index - 1;

    while (cursor >= 0 && input[cursor] === ESCAPE_CHAR) {
        slashCount += 1;
        cursor -= 1;
    }

    return slashCount % 2 === 1;
}

function splitByUnescaped(input, delimiter) {
    const parts = [];
    let buffer = "";

    for (let index = 0; index < input.length; index += 1) {
        const current = input[index];

        if (current === delimiter && !isEscaped(input, index)) {
            parts.push(buffer.trim());
            buffer = "";
            continue;
        }

        buffer += current;
    }

    parts.push(buffer.trim());
    return parts.filter((part) => part.length > 0);
}

function unescapeEscapedPipesAndSlashes(input) {
    return input.replace(/\\\|/g, "|").replace(/\\\\/g, "\\");
}

function unescapeEscapedOperators(input) {
    return OPERATORS.reduce(
        (current, operator) =>
            current.replaceAll(`${ESCAPE_CHAR}${operator}`, operator),
        input,
    );
}

function findUnescapedOperator(input) {
    for (let index = 0; index < input.length; index += 1) {
        if (isEscaped(input, index)) {
            continue;
        }

        for (const operator of OPERATORS) {
            if (input.startsWith(operator, index)) {
                return { operator, index };
            }
        }
    }

    return null;
}

function parseFilterTerm(rawFilter) {
    const cleaned = rawFilter.trim();
    const operatorMatch = findUnescapedOperator(cleaned);

    if (!operatorMatch) {
        return null;
    }

    const namesSegment = cleaned.slice(0, operatorMatch.index).trim();
    const valuesSegment = cleaned
        .slice(operatorMatch.index + operatorMatch.operator.length)
        .trim();

    const namesRaw =
        namesSegment.startsWith("(") && namesSegment.endsWith(")")
            ? namesSegment.slice(1, -1)
            : namesSegment;

    const names = splitByUnescaped(namesRaw, "|");

    const values = splitByUnescaped(valuesSegment, "|").map((value) =>
        unescapeEscapedPipesAndSlashes(unescapeEscapedOperators(value)),
    );

    const normalizedOperator = operatorMatch.operator.endsWith("*")
        ? operatorMatch.operator.slice(0, -1)
        : operatorMatch.operator;

    const parsedOperator = ["!@=", "@="].includes(normalizedOperator)
        ? "contains"
        : ["!_=", "_="].includes(normalizedOperator)
          ? "startsWith"
          : ["!_-=", "_-="].includes(normalizedOperator)
            ? "endsWith"
            : normalizedOperator === "=="
              ? "equals"
              : normalizedOperator === "!="
                ? "notEquals"
                : normalizedOperator === ">"
                  ? "greaterThan"
                  : normalizedOperator === "<"
                    ? "lessThan"
                    : normalizedOperator === ">="
                      ? "greaterThanOrEqual"
                      : "lessThanOrEqual";

    return {
        raw: cleaned,
        names,
        values,
        operator: operatorMatch.operator,
        parsedOperator,
        operatorIsCaseInsensitive: operatorMatch.operator.endsWith("*"),
        operatorIsNegated:
            parsedOperator !== "notEquals" &&
            operatorMatch.operator.startsWith("!"),
    };
}

export function parseFilters(filters) {
    if (!filters || typeof filters !== "string") {
        return [];
    }

    const tokens = splitByUnescaped(filters, ",");
    return tokens
        .map((token) => token.replace(/\\,/g, ","))
        .map(parseFilterTerm)
        .filter((term) => term !== null);
}

export function parseSorts(sorts) {
    if (!sorts || typeof sorts !== "string") {
        return [];
    }

    const tokens = splitByUnescaped(sorts, ",");
    const unique = new Set();
    const parsed = [];

    for (const token of tokens) {
        const cleaned = token.trim();
        if (!cleaned) {
            continue;
        }

        const descending = cleaned.startsWith("-");
        const name = descending ? cleaned.slice(1) : cleaned;

        if (unique.has(name)) {
            continue;
        }

        unique.add(name);
        parsed.push({ raw: cleaned, name, descending });
    }

    return parsed;
}

export function parseSieveModel(input = {}) {
    return {
        filters: parseFilters(input.filters),
        sorts: parseSorts(input.sorts),
        page: input.page ? Number.parseInt(input.page, 10) : undefined,
        pageSize: input.pageSize
            ? Number.parseInt(input.pageSize, 10)
            : undefined,
    };
}
