import {MemoryStorage} from '../src/default_memory_storage';

interface Item {
    primary: string;
    key2: string | number;
    key3: string;
}
const item1: Item = {primary: '1', key2: 'asdf', key3: 'blaat'};
const item2: Item = {primary: '2', key2: 'string', key3: 'blaat'};
const item3: Item = {primary: '3', key2: 5, key3: 'blaat'};
const item4: Item = {primary: '4', key2: 'asdf', key3: 'blaat'};

describe('DefaultMemoryStorage', () => {
    it('Should store a item by a key', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const store = new MemoryStorage<Item>(getter);

        /* When */
        store.add(item1);
        const item = store.get('1');

        /* Then */
        expect(store.size).toBe(1);
        expect(item).toBe(item1);
    });
    it('Should store two items by a key', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const store = new MemoryStorage<Item>(getter);

        /* When */
        store.addMultiple([item1, item2]);
        const gettedItem1 = store.get('1');
        const gettedItem2 = store.get('2');

        /* Then */
        expect(store.size).toBe(2);
        expect(gettedItem1).toBe(item1);
        expect(gettedItem2).toBe(item2);
    });
    it('Should store two items with a same secondary key value', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const getter2 = [(i: Item) => i.key2];
        const store = new MemoryStorage<Item>(getter, [getter2]);

        /* When */
        store.addMultiple([item1, item2, item3, item4]);
        const testSetValues = store.getByIndex(getter2, ['asdf'])?.values();
        const gettedItem1 = testSetValues?.next().value;
        const gettedItem4 = testSetValues?.next().value;
        const gettedItem2 = store.getByIndex(getter2, ['string'])?.values().next().value;
        const gettedItem3 = store.getByIndex(getter2, [5])?.values().next().value;

        /* Then */
        expect(store.size).toBe(4);
        expect(gettedItem1).toBe(item1);
        expect(gettedItem2).toBe(item2);
        expect(gettedItem3).toBe(item3);
        expect(gettedItem4).toBe(item4);

        expect(store['storage']).toEqual(
            new Map([
                ['1', item1],
                ['2', item2],
                ['3', item3],
                ['4', item4],
            ]),
        );
        expect(store['indices']).toEqual(
            new Map([
                [
                    getter2,
                    new Map<string | number, Set<string>>([
                        ['asdf', new Set([item1.primary, item4.primary])],
                        ['string', new Set([item2.primary])],
                        [5, new Set([item3.primary])],
                    ]),
                ],
            ]),
        );
    });
    it('Should remove items', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const getter2 = [(i: Item) => i.key2];
        const store = new MemoryStorage<Item>(getter, [getter2]);

        /* When */
        store.addMultiple([item1, item2, item3, item4]);
        store.delete(item1.primary);
        const testSet = store.getByIndex(getter2, ['asdf']);
        const testSetValues = testSet?.values();
        const gettedItem4 = testSetValues?.next().value;
        const gettedItem2 = store.get('2');
        const gettedItem3 = store.get('3');

        /* Then */
        expect(store.size).toBe(3);
        expect(testSet?.size).toBe(1);
        expect(gettedItem4).toBe(item4);
        expect(gettedItem2).toBe(item2);
        expect(gettedItem3).toBe(item3);

        expect(store['storage']).toEqual(
            new Map([
                ['2', item2],
                ['3', item3],
                ['4', item4],
            ]),
        );
        expect(store['indices']).toEqual(
            new Map([
                [
                    getter2,
                    new Map<string | number, Set<string>>([
                        ['asdf', new Set([item4.primary])],
                        ['string', new Set([item2.primary])],
                        [5, new Set([item3.primary])],
                    ]),
                ],
            ]),
        );
    });
    it('Should remove set inside storage when all items are removed', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const getter2 = [(i: Item) => i.key2];
        const store = new MemoryStorage<Item>(getter, [getter2]);

        /* When */
        store.addMultiple([item1, item2, item3, item4]);
        store.deleteMultiple([item1.primary, item4.primary]);
        const testSet = store.getByIndex(getter2, ['asdf']);
        const otherItems = store.all();

        /* Then */
        expect(store.size).toBe(2);
        expect(testSet).toBe(null);
        expect(otherItems).toEqual([item2, item3]);

        expect(store['storage']).toEqual(
            new Map([
                ['2', item2],
                ['3', item3],
            ]),
        );
        expect(store['indices']).toEqual(
            new Map([
                [
                    getter2,
                    new Map<string | number, Set<string>>([
                        ['string', new Set([item2.primary])],
                        [5, new Set([item3.primary])],
                    ]),
                ],
            ]),
        );
    });
    it('Should remove all sets inside storage when all items are removed', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const getter2 = [(i: Item) => i.key2];
        const store = new MemoryStorage<Item>(getter, [getter2]);

        /* When */
        store.addMultiple([item1, item2, item3, item4]);
        store.deleteMultiple([item1.primary, item2.primary, item3.primary, item4.primary]);
        const items = store.all();

        /* Then */
        expect(store.size).toBe(0);
        expect(items).toEqual([]);
        expect(store['storage']).toEqual(new Map());
        expect(store['indices']).toEqual(new Map([[getter2, new Map()]]));
    });
    it('Should support multiple keyFunctions', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const getter2 = [(i: Item) => i.key2];
        const getter3 = [(i: Item) => i.key3];
        const store = new MemoryStorage<Item>(getter, [getter2, getter3]);

        /* When */
        store.add(item1);
        const item1_1 = store.getByIndex(getter2, ['asdf'])?.values().next().value;
        const item1_2 = store.getByIndex(getter3, ['blaat'])?.values().next().value;

        /* Then */
        expect(store.size).toBe(1);
        expect(item1_1).toBe(item1);
        expect(item1_2).toBe(item1);
        expect(item1_1).toBe(item1_2);

        expect(store['indices']).toEqual(
            new Map([
                [getter2, new Map([['asdf', new Set([item1.primary])]])],
                [getter3, new Map([['blaat', new Set([item1.primary])]])],
            ]),
        );
    });
    it('Should support multiple keyFunctions with multiple items', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const getter2 = [(i: Item) => i.key2];
        const getter3 = [(i: Item) => i.key3];
        const store = new MemoryStorage<Item>(getter, [getter2, getter3]);

        /* When */
        store.addMultiple([item1, item2, item3, item4]);

        /* Then */
        expect(store.size).toBe(4);
        expect(store['storage']).toEqual(
            new Map([
                ['1', item1],
                ['2', item2],
                ['3', item3],
                ['4', item4],
            ]),
        );
        expect(store['indices']).toEqual(
            new Map([
                [
                    getter2,
                    new Map<string | number, Set<string>>([
                        ['asdf', new Set([item1.primary, item4.primary])],
                        ['string', new Set([item2.primary])],
                        [5, new Set([item3.primary])],
                    ]),
                ],
                [
                    getter3,
                    new Map<string | number, Set<string>>([
                        ['blaat', new Set([item1.primary, item2.primary, item3.primary, item4.primary])],
                    ]),
                ],
            ]),
        );
    });
    it('Should support fetching items with multiple indices', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const getter2 = (i: Item) => i.key2;
        const getter3 = (i: Item) => i.key3;
        const complexGetter1 = [getter2];
        const complexGetter2 = [getter3];
        const store = new MemoryStorage<Item>(getter, [complexGetter1, complexGetter2]);
        store.addMultiple([item1, item2, item3, item4]);

        /* When */
        const items = store.getByMultipleIndices([
            {indices: complexGetter1, keys: ['asdf']},
            {indices: complexGetter2, keys: ['blaat']},
        ]);

        /* Then */
        // expect(store.size).toBe(2);
        expect(items).toEqual(new Set([item1, item4]));
    });
    it('Should support fetching items with multiple indices including primary', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const getter3 = (i: Item) => i.key3;
        const complexGetter1 = [getter];
        const complexGetter2 = [getter3];
        const store = new MemoryStorage<Item>(getter, [complexGetter1, complexGetter2]);
        store.addMultiple([item1, item2, item3, item4]);

        /* When */
        const items = store.getByMultipleIndices([
            {indices: complexGetter1, keys: ['1']},
            {indices: complexGetter2, keys: ['blaat']},
        ]);

        /* Then */
        // expect(store.size).toBe(2);
        expect(items).toEqual(new Set([item1]));
    });
    it('Should support multiple keyFunctions while deleting items', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const getter2 = [(i: Item) => i.key2];
        const getter3 = [(i: Item) => i.key3];
        const store = new MemoryStorage<Item>(getter, [getter2, getter3]);

        /* When */
        store.addMultiple([item1, item2, item3, item4]);

        store.delete(item2.primary);

        /* Then */
        expect(store.size).toBe(3);
        expect(store['indices']).toEqual(
            new Map([
                [
                    getter2,
                    new Map<string | number, Set<string>>([
                        ['asdf', new Set([item1.primary, item4.primary])],
                        [5, new Set([item3.primary])],
                    ]),
                ],
                [
                    getter3,
                    new Map<string | number, Set<string>>([
                        ['blaat', new Set([item1.primary, item3.primary, item4.primary])],
                    ]),
                ],
            ]),
        );
    });
    it('Should support multiple keyFunctions while deleting all items', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const getter2 = [(i: Item) => i.key2];
        const getter3 = [(i: Item) => i.key3];
        const store = new MemoryStorage<Item>(getter, [getter2, getter3]);

        /* When */
        store.addMultiple([item1, item2, item3, item4]);
        store.deleteMultiple([item1.primary, item2.primary, item3.primary, item4.primary]);

        /* Then */
        expect(store.size).toBe(0);
        expect(store['indices']).toEqual(
            new Map([
                [getter2, new Map()],
                [getter3, new Map()],
            ]),
        );
    });
    it('Should support multiple keyFunctions while clearing all items', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const getter2 = [(i: Item) => i.key2];
        const getter3 = [(i: Item) => i.key3];
        const store = new MemoryStorage<Item>(getter, [getter2, getter3]);

        /* When */
        store.addMultiple([item1, item2, item3, item4]);
        store.clear();

        /* Then */
        expect(store.size).toBe(0);
        expect(store['storage']).toEqual(new Map());
        expect(store['indices']).toEqual(
            new Map([
                [getter2, new Map()],
                [getter3, new Map()],
            ]),
        );
    });
    it('should be able to update an item', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const getter2 = [(i: Item) => i.key2];
        const getter3 = [(i: Item) => i.key3];
        const store = new MemoryStorage<Item>(getter, [getter2, getter3]);
        store.addMultiple([item1, item2, item3, item4]);

        /* When */
        const newItem = {
            primary: '2',
            key2: 'new value',
            key3: 'another new value',
        };
        store.update(newItem);
        const allItems = store.all();

        /* Then */
        expect(store.size).toBe(4);
        expect(allItems).toEqual([item1, newItem, item3, item4]);
    });
    it('should be able to handle complex indices', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const getter2 = (i: Item) => i.key2;
        const getter3 = (i: Item) => i.key3;
        const complexGetter = [getter2, getter3];
        const store = new MemoryStorage<Item>(getter, [complexGetter]);
        store.addMultiple([item1, item2, item3, item4]);

        /* When */
        const allItems = store.all();
        const items = store.getByIndex(complexGetter, [5, 'blaat']);

        /* Then */
        expect(store.size).toBe(4);
        expect(allItems).toEqual([item1, item2, item3, item4]);
        expect(items).toEqual(new Set([item3]));
        expect(store['indices']).toEqual(
            new Map([
                [
                    complexGetter,
                    new Map<string | number, unknown>([
                        ['asdf', new Map([['blaat', new Set([item1.primary, item4.primary])]])],
                        ['string', new Map([['blaat', new Set([item2.primary])]])],
                        [5, new Map([['blaat', new Set([item3.primary])]])],
                    ]),
                ],
            ]),
        );
    });
    it('should be able to handle deep complex indices', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const getter2 = (i: Item) => i.key2;
        const getter3 = (i: Item) => i.key3;
        const complexGetter = [getter2, getter3, getter];
        const store = new MemoryStorage<Item>(getter, [complexGetter]);
        store.addMultiple([item1, item2, item3, item4]);

        /* When */
        const allItems = store.all();
        const items = store.getByIndex(complexGetter, ['asdf', 'blaat', '1']);

        /* Then */
        expect(store.size).toBe(4);
        expect(allItems).toEqual([item1, item2, item3, item4]);
        expect(items).toEqual(new Set([item1]));
        expect(store['indices']).toEqual(
            new Map([
                [
                    complexGetter,
                    new Map<string | number, unknown>([
                        [
                            'asdf',
                            new Map([
                                [
                                    'blaat',
                                    new Map([
                                        ['1', new Set([item1.primary])],
                                        ['4', new Set([item4.primary])],
                                    ]),
                                ],
                            ]),
                        ],
                        ['string', new Map([['blaat', new Map([['2', new Set([item2.primary])]])]])],
                        [5, new Map([['blaat', new Map([['3', new Set([item3.primary])]])]])],
                    ]),
                ],
            ]),
        );
    });
    it('should be able to handle delete items and clean up', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const getter2 = (i: Item) => i.key2;
        const getter3 = (i: Item) => i.key3;
        const complexGetter = [getter2, getter3, getter];
        const store = new MemoryStorage<Item>(getter, [complexGetter]);
        store.addMultiple([item1, item2, item3, item4]);

        /* When */
        const allItems = store.all();
        store.delete(item1.primary);
        store.delete(item2.primary);

        /* Then */
        // expect(store.size).toBe(2);
        expect(allItems).toEqual([item1, item2, item3, item4]);
        expect(store['indices']).toEqual(
            new Map([
                [
                    complexGetter,
                    new Map<string | number, unknown>([
                        ['asdf', new Map([['blaat', new Map([['4', new Set([item4.primary])]])]])],
                        [5, new Map([['blaat', new Map([['3', new Set([item3.primary])]])]])],
                    ]),
                ],
            ]),
        );
    });
    it('should be able to handle delete  all items and clean up', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const getter2 = (i: Item) => i.key2;
        const getter3 = (i: Item) => i.key3;
        const complexGetter = [getter2, getter3, getter];
        const store = new MemoryStorage<Item>(getter, [complexGetter]);
        store.addMultiple([item1, item2, item3, item4]);

        /* When */
        const allItems = store.all();
        store.delete(item1.primary);
        store.delete(item2.primary);
        store.delete(item3.primary);
        store.delete(item4.primary);

        /* Then */
        // expect(store.size).toBe(2);
        expect(allItems).toEqual([item1, item2, item3, item4]);
        expect(store['indices']).toEqual(new Map([[complexGetter, new Map<string | number, unknown>()]]));
    });
    it('Should return null if indices.length !== keys.length', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const getter2 = (i: Item) => i.key2;
        const getter3 = (i: Item) => i.key3;
        const complexGetter = [getter2, getter3, getter];
        const store = new MemoryStorage<Item>(getter, [complexGetter]);
        store.addMultiple([item1, item2, item3, item4]);

        /* When */
        const items = store.getByIndex(complexGetter, ['asdf', 'blaat', '1', '2']);

        /* Then */
        // expect(store.size).toBe(2);
        expect(items).toEqual(null);
    });
    it('Should return null we didnt find anything', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const getter2 = (i: Item) => i.key2;
        const getter3 = (i: Item) => i.key3;
        const complexGetter = [getter2, getter3, getter];
        const store = new MemoryStorage<Item>(getter, [complexGetter]);
        store.addMultiple([item1, item2, item3, item4]);

        /* When */
        const items = store.getByIndex(complexGetter, ['asdf', 'blaat', 'NO_EXIST']);

        /* Then */
        // expect(store.size).toBe(2);
        expect(items).toEqual(null);
    });
    it('Should return nothing if we didnt find anything with multiple indices', () => {
        /* Given */
        const getter = (i: Item) => i.primary;
        const getter2 = (i: Item) => i.key2;
        const getter3 = (i: Item) => i.key3;
        const complexGetter1 = [getter2];
        const complexGetter2 = [getter3];
        const store = new MemoryStorage<Item>(getter, [complexGetter1, complexGetter2]);
        store.addMultiple([item1, item2, item3, item4]);

        /* When */
        const items = store.getByMultipleIndices([
            {indices: complexGetter1, keys: ['asdf']},
            {indices: complexGetter2, keys: ['qqq']},
        ]);

        expect(items).toEqual(null);
    });
});
