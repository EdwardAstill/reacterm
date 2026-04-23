/**
 * TuiContext — React context providing access to screen, input, and exit.
 */
import { createContext, useContext, createElement } from "react";
export const TuiContext = createContext(null);
/** Access screen, input, focus, exit, requestRender, flushSync, and renderContext. */
export function useTui() {
    const ctx = useContext(TuiContext);
    if (!ctx) {
        throw new Error("useTui() must be used inside a <TuiProvider> (did you use render() from reacterm?)");
    }
    return ctx;
}
export function TuiProvider({ value, children }) {
    return createElement(TuiContext.Provider, { value }, children);
}
//# sourceMappingURL=TuiContext.js.map