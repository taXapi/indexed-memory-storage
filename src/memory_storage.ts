export type IndexGetter<T, K> = (item: T) => K;

export interface IMemoryStorage<T, PK = T[keyof T], K = T[keyof T]> {
    //Getters
    get size(): number;
    all(): T[];
    get(key: PK): T | null;
    getByIndex(keyFunctions: Array<IndexGetter<T, K>>, keys: Array<K>): Set<T> | null;
    getByMultipleIndices(indices: Array<{indices: Array<IndexGetter<T, K>>; keys: K[]}>): Set<T> | null;

    //Mutations
    clear(): void;
    add(item: T): T;
    addMultiple(items: T[]): Array<T>;
    deleteMultiple(keys: PK[]): Array<T | null>;
    delete(key: PK): T | null;
    update(item: T): T;
    updateMultiple(items: T[]): T[];
}
