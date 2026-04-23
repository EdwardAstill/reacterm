import { useTui } from "../context/TuiContext.js";
export function useApp() {
    const ctx = useTui();
    return {
        exit: (error) => {
            ctx.exit(error);
        },
        rerender: () => {
            ctx.requestRender();
        },
        clear: () => {
            ctx.clear();
        },
    };
}
//# sourceMappingURL=useApp.js.map