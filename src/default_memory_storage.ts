import {IndexGetter, IMemoryStorage} from './memory_storage';

type IndicesPath<T, K, P> = Map<K, IndicesPath<T, K, P> | Set<P>>;
type Indices<T, K, P> = Map<Array<IndexGetter<T, K>>, IndicesPath<T, K, P>>;

export class MemoryStorage<T, PK = T[keyof T], K = T[keyof T]> implements IMemoryStorage<T, PK, K> {
    private storage: Map<PK, T> = new Map();

    private indices: Indices<T, K, PK>;

    constructor(
        private primaryIndex: IndexGetter<T, PK>,
        private indicesList?: Array<Array<IndexGetter<T, K>>>,
    ) {
        this.indices = this.indicesList
            ? new Map(this.indicesList.map((keyFunction) => [keyFunction, new Map()]))
            : new Map();
    }

    public clear(): void {
        this.storage.clear();
        if (this.indices) {
            for (const [, map] of this.indices) {
                map.clear();
            }
        }
    }

    public addMultiple(items: T[]): Array<T> {
        return items.map((item) => this.add(item));
    }

    public deleteMultiple(keys: PK[]): Array<T | null> {
        return keys.map((key) => this.delete(key));
    }

    public updateMultiple(items: T[]): T[] {
        return items.map((item) => this.update(item));
    }

    /**
     * Method to resolve the path to a Entity inside our indices storage
     * The indices storage looks as the following:
     * Map(
     *   [array with indexGetters], Map(
     *     "value from indexGetter 1", Map(
     *       "value from indexGetter 2", Set<PK>()
     *     )
     *   )
     * )
     * Bascially its a map with as key the indexGetter arrays passed in the constructor
     * Each of these entries have as value a new Map that is recursively deep (as long as the indexGetter array)
     * Until we are at the leaf which is a Set with all the values inside
     */
    private _resolvePathToSet(
        item: T,
        indices: IndexGetter<T, K>[],
    ): {finalKey: K; path: Array<{key: K; cursor: IndicesPath<T, K, PK>}>; set: Set<PK>} {
        const path: Array<{key: K; cursor: IndicesPath<T, K, PK>}> = [];

        //Get our starting cursor, or create it if its missing (should have been created in the constructor)
        let cursor = this.indices.get(indices);
        if (!cursor) {
            const newMap: IndicesPath<T, K, PK> = new Map();
            this.indices.set(indices, newMap);
            cursor = newMap;
        }

        //Resolve our cursor to the deepest Map
        if (indices.length > 1) {
            for (let index = 0; index < indices.length - 1; index++) {
                const indexGetter = indices[index];
                const key = indexGetter(item);

                const existingDepth: Set<PK> | IndicesPath<T, K, PK> | undefined = cursor.get(key);
                if (existingDepth && existingDepth instanceof Map) {
                    cursor = existingDepth;
                } else {
                    const newDepth = new Map();
                    cursor.set(key, newDepth);
                    cursor = newDepth;
                }

                path.push({key, cursor});
            }
        }

        //If we are at the deepest Map, we can resolve the Set
        const finalKey = indices[indices.length - 1](item);
        const existingSet = cursor.get(finalKey);
        let set = existingSet && existingSet instanceof Set ? existingSet : null;
        if (set === null) {
            const newSet = new Set<PK>();
            cursor.set(finalKey, newSet);
            set = newSet;
        }

        return {
            finalKey,
            path,
            set,
        };
    }

    public add(item: T): T {
        const key = this.primaryIndex(item);
        if (this.storage.has(key)) {
            this.deleteFromIndices(item);
        }

        this.storage.set(key, item);
        if (this.indicesList && this.indices) {
            for (const complexIndices of this.indicesList) {
                const {set} = this._resolvePathToSet(item, complexIndices);
                set.add(key);
            }
        }

        return item;
    }

    public update(item: T): T {
        return this.add(item);
    }

    public all(): T[] {
        return Array.from(this.storage.values());
    }

    public get(key: PK): T | null {
        return this.storage.get(key) ?? null;
    }

    public get size(): number {
        return this.storage.size;
    }

    public getByIndex(keyFunctions: Array<IndexGetter<T, K>>, keys: Array<K>): Set<T> | null {
        if (keyFunctions.length !== keys.length) {
            console.warn('keyFunctions.length !== keys.length');
            return null;
        }

        let cursor: IndicesPath<T, K, PK> | Set<PK> | undefined = this.indices.get(keyFunctions);
        let index = 0;
        while (cursor) {
            if (cursor instanceof Set) {
                const result = new Set<T>();
                for (const primaryKey of cursor) {
                    const item = this.storage.get(primaryKey);
                    if (item) {
                        result.add(item);
                    }
                }
                return result;
            }
            if (index >= keys.length) {
                break;
            }
            cursor = cursor.get(keys[index++] as K);
        }
        return null;
    }

    public getByMultipleIndices(indices: Array<{indices: Array<IndexGetter<T, K>>; keys: K[]}>): Set<T> | null {
        if (indices.length === 0) {
            return null;
        }

        let sets: Set<T>[] = [];
        for (const kf of indices) {
            const set = this.getByIndex(kf.indices, kf.keys);
            if (set === null) {
                return null;
            }

            sets.push(set);
        }

        sets = sets.sort((a, b) => a.size - b.size);

        if (sets.length === 0) {
            return null;
        }
        if (sets.length === 1) {
            return sets[0];
        }

        const [smallestSet, ...otherSets] = sets;
        const resultSet = new Set<T>();
        for (const item of smallestSet) {
            if (otherSets.every((set) => set.has(item))) {
                resultSet.add(item);
            }
        }
        return resultSet;
    }

    public delete(key: PK): T | null {
        const item = this.storage.get(key);
        if (item) {
            this.storage.delete(key);
            this.deleteFromIndices(item);
            return item;
        }
        return null;
    }

    private deleteFromIndices(item: T): void {
        if (this.indicesList) {
            for (const complexIndices of this.indicesList) {
                const {path, set, finalKey} = this._resolvePathToSet(item, complexIndices);
                set.delete(this.primaryIndex(item));

                let key = finalKey;
                if (set.size === 0) {
                    for (const parent of path.reverse()) {
                        if (parent.cursor.get(key)?.size === 0) {
                            parent.cursor.delete(key);
                            key = parent.key;
                        } else {
                            break;
                        }
                    }

                    if (this.indices.get(complexIndices)?.get(key)?.size === 0) {
                        this.indices.get(complexIndices)?.delete(key);
                    }
                }
            }
        }
    }
}
