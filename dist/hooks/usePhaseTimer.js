/**
 * usePhaseTimer — schedule phase transitions with zero boilerplate.
 *
 * Replaces the manual setTimeout-chain pattern with a declarative timeline.
 * Each phase fires at its scheduled time, calls `flushSync` to update React
 * state, and cleans up automatically on unmount.
 *
 * ```tsx
 * // BEFORE — manual setTimeout chains, manual cleanup, easy to leak
 * const timers = useRef([]);
 * if (!started.current) {
 *   started.current = true;
 *   timers.current.push(setTimeout(() => flushSync(() => setPhase("boot")), 2000));
 *   timers.current.push(setTimeout(() => flushSync(() => setPhase("ready")), 4000));
 * }
 * useCleanup(() => timers.current.forEach(clearTimeout));
 *
 * // AFTER — declarative timeline, auto-cleanup
 * const phase = usePhaseTimer([
 *   { at: 0,    phase: "splash" },
 *   { at: 2000, phase: "boot" },
 *   { at: 4000, phase: "ready" },
 *   { at: 6000, phase: "running" },
 * ]);
 * ```
 */
import { useState, useRef } from "react";
import { useTui } from "../context/TuiContext.js";
import { useCleanup } from "./useCleanup.js";
export function usePhaseTimer(timeline, options = {}) {
    const { autoStart = true } = options;
    const { flushSync } = useTui();
    const initialPhase = timeline.length > 0 ? timeline[0].phase : "";
    const [phase, setPhase] = useState(initialPhase);
    const elapsedRef = useRef(0);
    const startTimeRef = useRef(null);
    const timersRef = useRef([]);
    const startedRef = useRef(false);
    const lastPhaseIdx = timeline.length - 1;
    const currentIdxRef = useRef(0);
    const scheduleAll = () => {
        if (startedRef.current)
            return;
        startedRef.current = true;
        startTimeRef.current = Date.now();
        for (let i = 1; i < timeline.length; i++) {
            const entry = timeline[i];
            const t = setTimeout(() => {
                currentIdxRef.current = i;
                elapsedRef.current = entry.at;
                entry.onEnter?.();
                flushSync(() => setPhase(entry.phase));
            }, entry.at);
            timersRef.current.push(t);
        }
    };
    if (autoStart && !startedRef.current) {
        scheduleAll();
    }
    useCleanup(() => {
        for (const t of timersRef.current)
            clearTimeout(t);
        timersRef.current = [];
    });
    return {
        phase,
        elapsed: elapsedRef.current,
        done: currentIdxRef.current >= lastPhaseIdx,
        start: scheduleAll,
        reset: () => {
            for (const t of timersRef.current)
                clearTimeout(t);
            timersRef.current = [];
            startedRef.current = false;
            currentIdxRef.current = 0;
            elapsedRef.current = 0;
            flushSync(() => setPhase(initialPhase));
        },
    };
}
//# sourceMappingURL=usePhaseTimer.js.map