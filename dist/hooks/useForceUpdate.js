import { useState } from "react";
import { useTui } from "../context/TuiContext.js";
export function useForceUpdate() {
    const { flushSync } = useTui();
    const [, setTick] = useState(0);
    return () => {
        flushSync(() => setTick((t) => t + 1));
    };
}
//# sourceMappingURL=useForceUpdate.js.map