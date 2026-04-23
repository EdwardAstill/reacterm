import React from "react";
import type { StormTextStyleProps } from "../../styles/styleProps.js";
export interface StatusMessageProps extends StormTextStyleProps {
    message: string;
    type?: "success" | "warning" | "error" | "info";
    title?: string;
    /** Optional detail text. When provided, shows a collapsible "Details" toggle. */
    detail?: string;
    /** Whether the component is focused (required for detail toggle via Enter). */
    isFocused?: boolean;
    /** Custom render for the status icon. */
    renderIcon?: (type: string, icon: string) => React.ReactNode;
}
export declare const StatusMessage: React.NamedExoticComponent<StatusMessageProps>;
//# sourceMappingURL=StatusMessage.d.ts.map