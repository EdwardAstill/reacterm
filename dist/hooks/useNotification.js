import { useRef } from "react";
import { useCleanup } from "./useCleanup.js";
import { useForceUpdate } from "./useForceUpdate.js";
let notifIdCounter = 0;
export function useNotification(options = {}) {
    const { maxVisible = 3, defaultDuration = 4000 } = options;
    const forceUpdate = useForceUpdate();
    const notificationsRef = useRef([]);
    const timersRef = useRef(new Map());
    const remove = (id) => {
        const timer = timersRef.current.get(id);
        if (timer !== undefined) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
        notificationsRef.current = notificationsRef.current.filter((n) => n.id !== id);
        forceUpdate();
    };
    const add = (message, type = "info", durationMs) => {
        const id = `notif-${notifIdCounter++}`;
        const duration = durationMs ?? defaultDuration;
        const notification = { id, message, type };
        if (durationMs !== undefined) {
            notification.durationMs = durationMs;
        }
        notificationsRef.current = [...notificationsRef.current, notification];
        // Trim to maxVisible (remove oldest)
        while (notificationsRef.current.length > maxVisible) {
            const oldest = notificationsRef.current[0];
            remove(oldest.id);
        }
        if (duration > 0) {
            const timer = setTimeout(() => {
                timersRef.current.delete(id);
                remove(id);
            }, duration);
            timersRef.current.set(id, timer);
        }
        forceUpdate();
        return id;
    };
    const clear = () => {
        for (const timer of timersRef.current.values()) {
            clearTimeout(timer);
        }
        timersRef.current.clear();
        notificationsRef.current = [];
        forceUpdate();
    };
    useCleanup(() => {
        for (const timer of timersRef.current.values()) {
            clearTimeout(timer);
        }
        timersRef.current.clear();
    });
    return {
        notifications: notificationsRef.current,
        add,
        remove,
        clear,
    };
}
//# sourceMappingURL=useNotification.js.map