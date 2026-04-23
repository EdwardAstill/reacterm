import { useRef } from "react";
import { useInput } from "./useInput.js";
function matchesHotkey(event, def) {
    // Match by key name or char
    const keyMatch = event.key === def.key || event.char === def.key;
    if (!keyMatch)
        return false;
    if ((def.ctrl ?? false) !== event.ctrl)
        return false;
    if ((def.shift ?? false) !== event.shift)
        return false;
    if ((def.meta ?? false) !== event.meta)
        return false;
    return true;
}
export function useHotkey(options) {
    const { hotkeys, isActive = true } = options;
    const hotkeysRef = useRef(hotkeys);
    hotkeysRef.current = hotkeys;
    useInput((event) => {
        for (const def of hotkeysRef.current) {
            if (matchesHotkey(event, def)) {
                def.action();
                return;
            }
        }
    }, { isActive });
    const bindings = hotkeys.map((def) => ({
        label: def.label,
        description: def.key,
    }));
    return { bindings };
}
//# sourceMappingURL=useHotkey.js.map