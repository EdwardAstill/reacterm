import { useRef } from "react";
import { useInput } from "./useInput.js";
import { useCleanup } from "./useCleanup.js";
import { useForceUpdate } from "./useForceUpdate.js";
import { matchKeySpec } from "./key-utils.js";
function formatSpec(spec) {
    const parts = [];
    if (spec.ctrl)
        parts.push("Ctrl");
    if (spec.shift)
        parts.push("Shift");
    if (spec.meta)
        parts.push("Meta");
    parts.push(spec.key.length === 1 ? spec.key.toUpperCase() : spec.key);
    return parts.join("+");
}
export function useKeyChord(options) {
    const { chords, isActive = true, timeoutMs = 1000 } = options;
    const forceUpdate = useForceUpdate();
    const pendingRef = useRef(null);
    const matchingChordsRef = useRef([]);
    const timerRef = useRef(null);
    const chordsRef = useRef(chords);
    chordsRef.current = chords;
    const clearPending = () => {
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (pendingRef.current !== null) {
            pendingRef.current = null;
            matchingChordsRef.current = [];
            forceUpdate();
        }
    };
    useInput((event) => {
        if (pendingRef.current !== null) {
            // We're waiting for the second key
            let matched = false;
            for (const chord of matchingChordsRef.current) {
                if (matchKeySpec(event, chord.second)) {
                    clearPending();
                    chord.action();
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                // Non-matching key — cancel
                clearPending();
            }
            return;
        }
        const matching = [];
        for (const chord of chordsRef.current) {
            if (matchKeySpec(event, chord.first)) {
                matching.push(chord);
            }
        }
        if (matching.length > 0) {
            matchingChordsRef.current = matching;
            pendingRef.current = formatSpec(matching[0].first);
            forceUpdate();
            // Start timeout
            timerRef.current = setTimeout(() => {
                timerRef.current = null;
                clearPending();
            }, timeoutMs);
        }
    }, { isActive });
    useCleanup(() => {
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    });
    return {
        pendingChord: pendingRef.current,
        bindings: chordsRef.current.map((c) => ({ label: c.label })),
    };
}
//# sourceMappingURL=useKeyChord.js.map