import { useRef } from "react";
import { useTui } from "../context/TuiContext.js";
export function useClipboard() {
    const { screen } = useTui();
    const contentRef = useRef(null);
    const copyRef = useRef((text) => {
        const encoded = Buffer.from(text).toString("base64");
        screen.write(`\x1b]52;c;${encoded}\x07`);
        contentRef.current = text;
    });
    const readRef = useRef(() => {
        // Request clipboard contents via OSC 52 with '?' query
        screen.write(`\x1b]52;c;?\x07`);
    });
    return {
        copy: copyRef.current,
        read: readRef.current,
        content: contentRef.current,
    };
}
//# sourceMappingURL=useClipboard.js.map