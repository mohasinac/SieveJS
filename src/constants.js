/**
 * Shared parser and processor constants.
 */
export const DEFAULT_OPTIONS = {
    caseSensitive: false,
    defaultPageSize: 0,
    maxPageSize: 0,
    throwExceptions: false,
    ignoreNullsOnNotEqual: true,
};

export const OPERATORS = [
    "!@=*",
    "!_=*",
    "!_-=*",
    "!=*",
    "!@=",
    "!_=",
    "!_-=",
    "==*",
    "@=*",
    "_=*",
    "_-=*",
    "==",
    "!=",
    ">=",
    "<=",
    ">",
    "<",
    "@=",
    "_=",
    "_-=",
];

export const ESCAPE_CHAR = "\\";
