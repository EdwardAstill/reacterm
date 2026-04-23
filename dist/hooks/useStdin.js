import { useTui } from "../context/TuiContext.js";
export function useStdin() {
    const ctx = useTui();
    const { stdin } = ctx.screen;
    return {
        stdin,
        setRawMode: (value) => {
            if (stdin.isTTY) {
                stdin.setRawMode(value);
            }
        },
        isRawModeSupported: Boolean(stdin.isTTY),
    };
}
//# sourceMappingURL=useStdin.js.map