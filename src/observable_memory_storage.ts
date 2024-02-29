import {Observable, Subject} from 'rxjs';
import {IndexGetter, MemoryStorage} from './memory_storage';

export enum StorageEventType {
    ADDED = 'added',
    ADDED_MULTIPLE = 'added-multiple',
    DELETED = 'deleted',
    DELETED_MULTIPLE = 'deleted-multiple',
    UPDATED = 'updated',
    UPDATED_MULTIPLE = 'updated-multiple',
    STORAGE_CLEARED = 'storage-cleared',
}
interface StorageEventBase {
    type: StorageEventType;
}

interface AddedEvent<T> extends StorageEventBase {
    type: StorageEventType.ADDED;
    item: T;
}

interface AddedMultipleEvent<T> extends StorageEventBase {
    type: StorageEventType.ADDED_MULTIPLE;
    items: ReadonlyArray<T>;
}

interface DeletedEvent<T> extends StorageEventBase {
    type: StorageEventType.DELETED;
    item: T;
}
interface DeletedMultipleEvent<T> extends StorageEventBase {
    type: StorageEventType.DELETED_MULTIPLE;
    items: ReadonlyArray<T | null>;
}
interface UpdatedEvent<T> extends StorageEventBase {
    type: StorageEventType.UPDATED;
    item: T;
}
interface UpdatedMultipleEvent<T> extends StorageEventBase {
    type: StorageEventType.UPDATED_MULTIPLE;
    items: ReadonlyArray<T>;
}
interface StorageClearedEvent extends StorageEventBase {
    type: StorageEventType.STORAGE_CLEARED;
}

export type StorageEvent<T> =
    | AddedEvent<T>
    | AddedMultipleEvent<T>
    | DeletedEvent<T>
    | DeletedMultipleEvent<T>
    | UpdatedEvent<T>
    | UpdatedMultipleEvent<T>
    | StorageClearedEvent;

export class ObservableMemoryStorage<T, PK = T[keyof T], K = T[keyof T]> implements MemoryStorage<T, PK, K> {
    private _eventsStream = new Subject<StorageEvent<T>>();

    constructor(private defaultMemoryStorage: MemoryStorage<T, PK, K>) {}

    public get eventsStream(): Observable<StorageEvent<T>> {
        return this._eventsStream;
    }

    public get size(): number {
        return this.defaultMemoryStorage.size;
    }

    public all(): T[] {
        return this.defaultMemoryStorage.all();
    }

    public get(key: PK): T | null {
        return this.defaultMemoryStorage.get(key);
    }

    public getByIndex(keyFunctions: Array<IndexGetter<T, K>>, keys: K[]): Set<T> | null {
        return this.defaultMemoryStorage.getByIndex(keyFunctions, keys);
    }

    public getByMultipleIndices(indices: {indices: IndexGetter<T, K>[]; keys: K[]}[]): Set<T> | null {
        return this.defaultMemoryStorage.getByMultipleIndices(indices);
    }

    public clear(): void {
        const result = this.defaultMemoryStorage.clear();
        this._eventsStream.next({type: StorageEventType.STORAGE_CLEARED});
        return result;
    }

    public add(item: T): T {
        const addedItem = this.defaultMemoryStorage.add(item);
        this._eventsStream.next({type: StorageEventType.ADDED, item: addedItem});
        return addedItem;
    }

    public addMultiple(items: T[]): T[] {
        const newItems = this.defaultMemoryStorage.addMultiple(items);
        this._eventsStream.next({type: StorageEventType.ADDED_MULTIPLE, items: newItems});
        return newItems;
    }

    public delete(key: PK): T | null {
        const deletedItem = this.defaultMemoryStorage.delete(key);
        if (deletedItem) {
            this._eventsStream.next({type: StorageEventType.DELETED, item: deletedItem});
        }
        return deletedItem;
    }

    public deleteMultiple(keys: PK[]): (T | null)[] {
        const deletedItems = this.defaultMemoryStorage.deleteMultiple(keys);
        this._eventsStream.next({type: StorageEventType.DELETED_MULTIPLE, items: deletedItems});
        return deletedItems;
    }

    public update(item: T): T {
        const updatedItem = this.defaultMemoryStorage.update(item);
        this._eventsStream.next({type: StorageEventType.UPDATED, item: updatedItem});
        return updatedItem;
    }

    public updateMultiple(items: T[]): T[] {
        const updatedItems = this.defaultMemoryStorage.updateMultiple(items);
        this._eventsStream.next({type: StorageEventType.UPDATED_MULTIPLE, items: updatedItems});
        return updatedItems;
    }
}
