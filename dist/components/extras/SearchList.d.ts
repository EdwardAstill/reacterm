import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface SearchListItem {
    /** Stable identifier passed to onSelect. */
    value: string;
    /** Visible text. Also the field used for filtering when no `searchableText` is set. */
    label: string;
    /** Greyed out, not navigable. */
    disabled?: boolean;
    /** Optional alternate string used for filter matching (defaults to `label`). */
    searchableText?: string;
    /** Custom React node rendered in place of the plain label. */
    richLabel?: React.ReactNode;
}
export interface SearchListProps<TItem extends SearchListItem = SearchListItem> extends StormLayoutStyleProps {
    items: TItem[];
    /** Fired when the user presses Enter on an active option. */
    onSelect?: (value: string, item: TItem) => void;
    /** Fired whenever the highlighted item changes. */
    onChange?: (value: string, item: TItem) => void;
    /** Fired when the user presses Escape on an empty query. */
    onCancel?: () => void;
    /** Whether the component receives keyboard input. Default: true. */
    isFocused?: boolean;
    /** Placeholder shown when query is empty. */
    placeholder?: string;
    /** Maximum visible items in the list. Scrolls when exceeded. */
    maxVisible?: number;
    /** Selection indicator (default: personality.interaction.selectionChar). */
    indicator?: string;
    /** Color of the active list item. */
    activeColor?: string | number;
    /** Color of the search icon. */
    iconColor?: string | number;
    /** Search icon override (default: 🔍). */
    searchIcon?: string;
    /** Show "N results" inline next to the query. Default: true. */
    showResultCount?: boolean;
    /** Custom predicate for filtering. Receives the query (lowercased). */
    filter?: (item: TItem, query: string) => boolean;
    /** Hide the list entirely while query is empty. Default: false. */
    hideListUntilQuery?: boolean;
    /** Debounce delay in ms before recomputing filter. 0 = immediate (default). */
    debounceMs?: number;
    /** ARIA label applied to the listbox. */
    "aria-label"?: string;
}
/**
 * SearchInput + filtered list as one component with a single focus owner.
 *
 * Internally registers ONE keyboard handler that routes:
 *   - printable + backspace → query buffer
 *   - up / down → list navigation
 *   - return → onSelect of the active item
 *   - escape → clear query (or onCancel when query is already empty)
 *
 * This eliminates the multi-`isFocused` pattern flagged in
 * `improvements.md` §4 and gives consumers a single point of control.
 *
 * @example
 * <SearchList
 *   items={commands}
 *   placeholder="Find a command…"
 *   onSelect={(value) => run(value)}
 * />
 */
export declare function SearchList<TItem extends SearchListItem = SearchListItem>(rawProps: SearchListProps<TItem>): React.ReactElement;
//# sourceMappingURL=SearchList.d.ts.map