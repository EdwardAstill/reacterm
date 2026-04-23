import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface SearchInputProps extends StormLayoutStyleProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit?: (value: string) => void;
    /** Called when Escape is pressed to clear the input */
    onClear?: () => void;
    placeholder?: string;
    /** @deprecated Use isFocused instead */
    focus?: boolean;
    /** Whether the input is focused. */
    isFocused?: boolean;
    /** Shows a spinner indicator when true */
    loading?: boolean;
    /** Debounce delay in ms before calling onChange. 0 = immediate (default). */
    debounceMs?: number;
    /** Shows result count next to the input. Number or "N of M" string. */
    resultCount?: number | string;
    /** Custom render for the search icon area. */
    renderIcon?: (state: {
        loading: boolean;
    }) => React.ReactNode;
    "aria-label"?: string;
}
export declare const SearchInput: React.NamedExoticComponent<SearchInputProps>;
//# sourceMappingURL=SearchInput.d.ts.map