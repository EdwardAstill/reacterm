import React from "react";
export interface StreamingTextProps {
    text: string;
    color?: string | number;
    cursor?: boolean;
    streaming?: boolean;
    /** When true, reveal text character by character. */
    animate?: boolean;
    /** Characters revealed per tick when animate is true (default: 2). */
    speed?: number;
    /** Callback fired when all text has been revealed (animate mode). */
    onComplete?: () => void;
    /** Override the cursor character (default: "▊"). */
    cursorCharacter?: string;
    /** Override cursor blink interval in ms (default: 530). */
    cursorBlinkInterval?: number;
    /** Custom render for the cursor. Receives the cursor character and current visibility. */
    renderCursor?: (char: string, visible: boolean) => React.ReactNode;
}
export declare const StreamingText: React.NamedExoticComponent<StreamingTextProps>;
//# sourceMappingURL=StreamingText.d.ts.map