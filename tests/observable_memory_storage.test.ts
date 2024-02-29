import {DefaultMemoryStorage} from '../src/default_memory_storage';
import {ObservableMemoryStorage, StorageEventType} from '../src/observable_memory_storage';

interface Item {
    primary: string;
    key2: string | number;
    key3: string;
}
const item1: Item = {primary: '1', key2: 'asdf', key3: 'blaat'};
const item2: Item = {primary: '2', key2: 'string', key3: 'blaat'};
const item3: Item = {primary: '3', key2: 5, key3: 'blaat'};
const item4: Item = {primary: '4', key2: 'asdf', key3: 'blaat'};

describe('ObservableMemoryStorage', () => {
    it('Should receive an event when an item is added', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const store = new ObservableMemoryStorage<Item>(new DefaultMemoryStorage(getter));
        const listener = jest.fn();
        store.eventsStream.subscribe(listener);

        /* When */
        store.add(item1);
        store.add(item2);

        /* Then */
        expect(listener).toHaveBeenNthCalledWith(1, {
            type: StorageEventType.ADDED,
            item: item1,
        });
        expect(listener).toHaveBeenNthCalledWith(2, {
            type: StorageEventType.ADDED,
            item: item2,
        });
    });
    it('Should receive added_multiple events', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const store = new ObservableMemoryStorage<Item>(new DefaultMemoryStorage(getter));
        const listener = jest.fn();
        store.eventsStream.subscribe(listener);

        /* When */
        store.addMultiple([item1, item2]);

        /* Then */
        expect(listener).toHaveBeenNthCalledWith(1, {
            type: StorageEventType.ADDED_MULTIPLE,
            items: [item1, item2],
        });
    });
    it('Should receive delete events', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const store = new ObservableMemoryStorage<Item>(new DefaultMemoryStorage(getter));
        const listener = jest.fn();
        store.eventsStream.subscribe(listener);
        store.addMultiple([item1, item2, item3, item4]);

        /* When */
        store.delete(item1.primary);
        store.delete(item3.primary);

        /* Then */
        expect(listener).toHaveBeenNthCalledWith(2, {
            type: StorageEventType.DELETED,
            item: item1,
        });
        expect(listener).toHaveBeenNthCalledWith(3, {
            type: StorageEventType.DELETED,
            item: item3,
        });
    });
    it('Should receive delete_multiple events', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const store = new ObservableMemoryStorage<Item>(new DefaultMemoryStorage(getter));
        const listener = jest.fn();
        store.eventsStream.subscribe(listener);
        store.addMultiple([item1, item2, item3, item4]);

        /* When */
        store.deleteMultiple([item1.primary, item3.primary]);

        /* Then */
        expect(listener).toHaveBeenNthCalledWith(2, {
            type: StorageEventType.DELETED_MULTIPLE,
            items: [item1, item3],
        });
    });
    it('Should receive update events', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const store = new ObservableMemoryStorage<Item>(new DefaultMemoryStorage(getter));
        const listener = jest.fn();
        store.eventsStream.subscribe(listener);
        store.addMultiple([item1, item2, item3, item4]);

        /* When */
        const updatedItem1 = {
            primary: item1.primary,
            key2: '1_1',
            key3: '1_2',
        };
        const updatedItem3 = {
            primary: item3.primary,
            key2: '2_1',
            key3: '2_2',
        };
        store.update(updatedItem1);
        store.update(updatedItem3);

        /* Then */
        expect(listener).toHaveBeenNthCalledWith(2, {
            type: StorageEventType.UPDATED,
            item: updatedItem1,
        });
        expect(listener).toHaveBeenNthCalledWith(3, {
            type: StorageEventType.UPDATED,
            item: updatedItem3,
        });
    });
    it('Should receive update multiple events', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const store = new ObservableMemoryStorage<Item>(new DefaultMemoryStorage(getter));
        const listener = jest.fn();
        store.eventsStream.subscribe(listener);
        store.addMultiple([item1, item2, item3, item4]);

        /* When */
        const updatedItem1 = {
            primary: item1.primary,
            key2: '1_1',
            key3: '1_2',
        };
        const updatedItem3 = {
            primary: item3.primary,
            key2: '2_1',
            key3: '2_2',
        };
        store.updateMultiple([updatedItem1, updatedItem3]);

        /* Then */
        expect(listener).toHaveBeenNthCalledWith(2, {
            type: StorageEventType.UPDATED_MULTIPLE,
            items: [updatedItem1, updatedItem3],
        });
    });
});
