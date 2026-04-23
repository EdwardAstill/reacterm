import { useRef, useCallback } from "react";
import { useForceUpdate } from "./useForceUpdate.js";
/** Default in-memory storage backed by a Map. */
export function memoryStorage() {
    const store = new Map();
    return {
        get: (key) => store.get(key) ?? null,
        set: (key, value) => store.set(key, value),
        remove: (key) => store.delete(key),
    };
}
// Singleton default storage so state persists across hook calls within a session
const defaultStorage = memoryStorage();
export function usePersistentState(options) {
    const { key, initial, serialize = JSON.stringify, deserialize = JSON.parse, storage = defaultStorage, } = options;
    const forceUpdate = useForceUpdate();
    const valueRef = useRef(initial);
    // Hydrate from storage on first render
    const hydratedRef = useRef(false);
    if (!hydratedRef.current) {
        hydratedRef.current = true;
        const stored = storage.get(key);
        if (stored !== null) {
            try {
                valueRef.current = deserialize(stored);
            }
            catch {
                // If deserialization fails, keep initial value
            }
        }
    }
    const set = useCallback((newValue) => {
        valueRef.current = newValue;
        storage.set(key, serialize(newValue));
        forceUpdate();
    }, [key, serialize, storage, forceUpdate]);
    const reset = useCallback(() => {
        valueRef.current = initial;
        storage.remove(key);
        forceUpdate();
    }, [key, initial, storage, forceUpdate]);
    return {
        value: valueRef.current,
        set,
        reset,
    };
}
//# sourceMappingURL=usePersistentState.js.map