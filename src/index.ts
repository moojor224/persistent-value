type Awaitable<T> = Promise<T> | T;
type PersistOptions = {
    key: string;
    acquireMessage: string;
    acquireValue: (message: string) => Awaitable<string | null>;
    optional: boolean;
    validator?: (value: string | null) => boolean;
};

type ExtraPersistOptions = {
    value: string | null;
    hasTried: boolean;
};

const values: Record<string, PersistOptions & ExtraPersistOptions> = {};

export interface StorageAdapter {
    hasItem(key: string): boolean;
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}
export type PersistentValue = {
    /** get the current value */
    get(): string | null;
    /** returns true if the current value !== null */
    has(): boolean;
    /** set the value */
    set(value: string): void;
    /** returns true if the value is optional (can be null) */
    isOptional(): boolean;
    /** get the key used to store the value in the storage adapter */
    getKey(): string;
};

const localstorageAdapter = {
    hasItem(key: string): boolean {
        return localStorage.getItem(key) !== null;
    },
    getItem(key: string): string | null {
        return localStorage.getItem(key);
    },
    setItem(key: string, value: string): void {
        localStorage.setItem(key, value);
    }
} satisfies StorageAdapter;

/**
 * Retrieve a persistent value from the given storage adapter. Creates a new one if it didn't already exist
 *
 * @param options Options to define how the value should be acquired
 * @param storageAdapter An optional storage API to store the value in a specific location. Defaults to use the localStorage API
 */
export async function persistValue(
    options: PersistOptions,
    storageAdapter: StorageAdapter = localstorageAdapter
): Promise<PersistentValue> {
    const storageKey = "persist-" + options.key;
    let opts: (typeof values)[string];
    if (values[options.key]) {
        opts = values[options.key]; // gets the already-created PVal
    } else {
        // create a new PVal
        opts = {
            ...options,
            value: null,
            hasTried: false
        };
    }
    values[options.key] = opts;
    if (storageAdapter.hasItem(storageKey)) {
        opts.value = opts.value || storageAdapter.getItem(storageKey); // read saved value if cached value is null (storage value will be null if no value saved)
    }
    if ((!opts.hasTried && opts.value === null) || (opts.value === null && !opts.optional)) {
        // haven't tried to get value
        // OR
        // value is not defined and value is mandatory
        const value = await options.acquireValue(
            (opts.hasTried && !opts.optional ? "A value must be entered\n" : "") + options.acquireMessage
        );
        opts.value = value;
        opts.hasTried = true;
    }
    if (opts.value !== null) {
        storageAdapter.setItem(storageKey, opts.value);
    }
    return {
        get: () => opts.value,
        getKey: () => opts.key,
        has: () => opts.value !== null,
        isOptional: () => opts.optional,
        set: (value) => {
            storageAdapter.setItem(storageKey, value);
            opts.value = value;
        }
    };
}
