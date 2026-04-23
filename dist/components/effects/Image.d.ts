import React from "react";
/** Check if chafa-wasm acceleration is active */
export declare function isChafaAccelerated(): boolean;
export declare function isColoredUnderlineSupported(): boolean;
export interface ImageProps {
    src: string;
    width?: number;
    height?: number;
    protocol?: "kitty" | "iterm2" | "sixel" | "block" | "auto";
    alt?: string;
    preserveAspectRatio?: boolean;
    basePath?: string;
}
export declare const Image: React.NamedExoticComponent<ImageProps>;
//# sourceMappingURL=Image.d.ts.map