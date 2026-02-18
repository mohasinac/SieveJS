/**
 * Metadata model that defines filter/sort exposure for a field.
 */
export class SieveAttribute {
    constructor({ canFilter = false, canSort = false, name } = {}) {
        this.canFilter = canFilter;
        this.canSort = canSort;
        this.name = name;
    }
}
