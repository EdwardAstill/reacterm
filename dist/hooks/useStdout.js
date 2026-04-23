import { useTui } from "../context/TuiContext.js";
export function useStdout() {
    const ctx = useTui();
    const { screen } = ctx;
    return {
        stdout: screen.stdout,
        write: (data) => {
            screen.write(data);
        },
    };
}
//# sourceMappingURL=useStdout.js.map