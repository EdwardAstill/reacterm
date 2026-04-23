import { useRef } from "react";
import { announce as makeAnnouncement } from "../core/accessibility.js";
import { useTui } from "../context/TuiContext.js";
/**
 * Hook to announce dynamic content changes to screen readers.
 *
 * @example
 * ```tsx
 * function StatusUpdate() {
 *   const { announce } = useAnnounce();
 *
 *   function onSave() {
 *     // ... save logic
 *     announce("File saved successfully");
 *   }
 *
 *   return <Button onPress={onSave}>Save</Button>;
 * }
 * ```
 */
export function useAnnounce() {
    const { screen } = useTui();
    const ref = useRef(null);
    if (ref.current === null) {
        ref.current = {
            announce: (message) => {
                screen.write(makeAnnouncement(message, "polite"));
            },
            announceUrgent: (message) => {
                screen.write(makeAnnouncement(message, "assertive"));
            },
        };
    }
    return ref.current;
}
//# sourceMappingURL=useAnnounce.js.map