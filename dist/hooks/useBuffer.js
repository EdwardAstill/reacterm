/**
 * useBuffer — gives components limited direct access to the screen buffer.
 *
 * Useful for custom rendering effects that bypass the normal layout/paint
 * pipeline. Write cells at absolute screen coordinates, read existing
 * cell content, and request a repaint.
 *
 * Usage:
 * ```tsx
 * const { writeCell, readCell, requestRender } = useBuffer();
 * writeCell(10, 5, "X", "#ff0000");
 * requestRender();
 * ```
 */
import { useTui } from "../context/TuiContext.js";
import { parseColor } from "../core/types.js";
export function useBuffer() {
    const { renderContext, requestRender } = useTui();
    return {
        writeCell(x, y, char, fg, bg) {
            const buffer = renderContext.buffer;
            if (!buffer)
                return;
            if (x < 0 || x >= buffer.width || y < 0 || y >= buffer.height)
                return;
            const cell = buffer.getCell(x, y);
            buffer.setCell(x, y, {
                char,
                fg: fg !== undefined ? parseColor(fg) : cell.fg,
                bg: bg !== undefined ? parseColor(bg) : cell.bg,
                attrs: cell.attrs,
                ulColor: cell.ulColor,
            });
        },
        readCell(x, y) {
            const buffer = renderContext.buffer;
            if (!buffer)
                return null;
            if (x < 0 || x >= buffer.width || y < 0 || y >= buffer.height)
                return null;
            const cell = buffer.getCell(x, y);
            return { char: cell.char, fg: cell.fg, bg: cell.bg };
        },
        requestRender,
    };
}
//# sourceMappingURL=useBuffer.js.map