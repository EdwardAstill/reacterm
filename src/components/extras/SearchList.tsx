import React, { useCallback, useRef } from "react";
import { useColors } from "../../hooks/useColors.js";
import { useInput } from "../../hooks/useInput.js";
import { useTui } from "../../context/TuiContext.js";
import { useForceUpdate } from "../../hooks/useForceUpdate.js";
import { useCleanup } from "../../hooks/useCleanup.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { usePersonality } from "../../core/personality.js";
import { pickLayoutProps } from "../../styles/applyStyles.js";
import {
  computeScrollWindow,
  findFirstNavigable,
  findNextNavigable,
} from "../../utils/navigation.js";
import type { KeyEvent } from "../../input/types.js";
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

export interface SearchListProps<TItem extends SearchListItem = SearchListItem>
  extends StormLayoutStyleProps {
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

const DEFAULT_SEARCH_ICON = "🔍";
const DEFAULT_MAX_VISIBLE = 8;

function defaultMatch<T extends SearchListItem>(item: T, q: string): boolean {
  if (q === "") return true;
  const haystack = (item.searchableText ?? item.label).toLowerCase();
  return haystack.includes(q);
}

function isNavigable(item: SearchListItem | undefined): boolean {
  return !!item && !item.disabled;
}

function applyFilter<T extends SearchListItem>(
  items: T[],
  query: string,
  filter?: (item: T, query: string) => boolean,
): T[] {
  if (query === "") return items;
  const q = query.toLowerCase();
  if (filter) return items.filter((item) => filter(item, q));
  return items.filter((item) => defaultMatch(item, q));
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
export function SearchList<TItem extends SearchListItem = SearchListItem>(
  rawProps: SearchListProps<TItem>,
): React.ReactElement {
  const colors = useColors();
  const personality = usePersonality();
  const props = usePluginProps("SearchList", rawProps) as SearchListProps<TItem>;
  const {
    items,
    onSelect,
    onChange,
    onCancel,
    isFocused = true,
    placeholder = "Search…",
    maxVisible = DEFAULT_MAX_VISIBLE,
    indicator,
    activeColor = colors.brand.primary,
    iconColor = colors.text.dim,
    searchIcon = DEFAULT_SEARCH_ICON,
    showResultCount = true,
    filter,
    hideListUntilQuery = false,
    debounceMs = 0,
  } = props;

  const { requestRender } = useTui();
  const forceUpdate = useForceUpdate();

  // Stable refs so the input handler always sees the latest values, even
  // across synchronous keypress bursts that don't get a re-render between them.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  const filterRef = useRef(filter);
  filterRef.current = filter;
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Internal state owned by SearchList (no useSearchFilter — we need full
  // control so the handler can reason about the freshest filtered list).
  const queryRef = useRef("");
  const filteredRef = useRef<TItem[]>(items);
  const activeIndexRef = useRef(
    findFirstNavigable(items.length, (i) => isNavigable(items[i])),
  );
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-filter whenever the items array changes by reference (parent updated it).
  const lastItemsRef = useRef(items);
  if (lastItemsRef.current !== items) {
    lastItemsRef.current = items;
    filteredRef.current = applyFilter(items, queryRef.current, filterRef.current);
    if (activeIndexRef.current >= filteredRef.current.length) {
      activeIndexRef.current = findFirstNavigable(
        filteredRef.current.length,
        (i) => isNavigable(filteredRef.current[i]),
      );
    }
  }

  const recomputeFiltered = useCallback(() => {
    filteredRef.current = applyFilter(
      itemsRef.current,
      queryRef.current,
      filterRef.current,
    );
    // Clamp active index so the visible list always has a navigable selection.
    if (filteredRef.current.length === 0) {
      activeIndexRef.current = 0;
    } else if (activeIndexRef.current >= filteredRef.current.length) {
      activeIndexRef.current = findFirstNavigable(
        filteredRef.current.length,
        (i) => isNavigable(filteredRef.current[i]),
      );
    } else if (!isNavigable(filteredRef.current[activeIndexRef.current])) {
      activeIndexRef.current = findNextNavigable(
        filteredRef.current.length,
        activeIndexRef.current,
        1,
        (i) => isNavigable(filteredRef.current[i]),
      );
    }
  }, []);

  const setQueryAndRefresh = useCallback((next: string) => {
    queryRef.current = next;
    if (debounceMs <= 0) {
      recomputeFiltered();
      forceUpdate();
      requestRender();
      return;
    }
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      recomputeFiltered();
      forceUpdate();
      requestRender();
    }, debounceMs);
    // Always re-render the input row immediately so the cursor and query
    // text track typing, even with debounced filtering.
    forceUpdate();
    requestRender();
  }, [debounceMs, recomputeFiltered, forceUpdate, requestRender]);

  useCleanup(() => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  });

  const handleInput = useCallback((event: KeyEvent) => {
    if (event.key === "up") {
      event.consumed = true;
      const list = filteredRef.current;
      if (list.length === 0) return;
      const next = findNextNavigable(
        list.length,
        activeIndexRef.current,
        -1,
        (i) => isNavigable(list[i]),
      );
      if (next !== activeIndexRef.current) {
        activeIndexRef.current = next;
        const item = list[next];
        if (item) onChangeRef.current?.(item.value, item);
        forceUpdate();
        requestRender();
      }
      return;
    }
    if (event.key === "down") {
      event.consumed = true;
      const list = filteredRef.current;
      if (list.length === 0) return;
      const next = findNextNavigable(
        list.length,
        activeIndexRef.current,
        1,
        (i) => isNavigable(list[i]),
      );
      if (next !== activeIndexRef.current) {
        activeIndexRef.current = next;
        const item = list[next];
        if (item) onChangeRef.current?.(item.value, item);
        forceUpdate();
        requestRender();
      }
      return;
    }
    if (event.key === "return") {
      event.consumed = true;
      const item = filteredRef.current[activeIndexRef.current];
      if (item && isNavigable(item)) {
        onSelectRef.current?.(item.value, item);
      }
      return;
    }

    // Escape: clear the query first; second press calls onCancel.
    if (event.key === "escape") {
      event.consumed = true;
      if (queryRef.current.length > 0) {
        setQueryAndRefresh("");
      } else {
        onCancelRef.current?.();
      }
      return;
    }

    if (event.key === "backspace") {
      event.consumed = true;
      if (queryRef.current.length > 0) {
        setQueryAndRefresh(queryRef.current.slice(0, -1));
      }
      return;
    }
    if (event.char && event.char.length === 1 && !event.ctrl && !event.meta) {
      event.consumed = true;
      setQueryAndRefresh(queryRef.current + event.char);
      return;
    }
  }, [forceUpdate, requestRender, setQueryAndRefresh]);

  useInput(handleInput, { isActive: isFocused });

  const selectionChar = indicator ?? personality.interaction.selectionChar;
  const query = queryRef.current;
  const filteredItems = filteredRef.current;

  // ── Render ────────────────────────────────────────────────────────────
  const queryDisplay = query.length === 0
    ? React.createElement(
        "tui-text",
        { key: "ph", color: colors.text.dim, dim: true },
        placeholder,
      )
    : React.createElement(
        "tui-text",
        { key: "q", color: colors.text.primary },
        query,
      );

  const cursor = isFocused
    ? React.createElement(
        "tui-text",
        { key: "cur", color: colors.text.primary, inverse: true },
        " ",
      )
    : null;

  const inputRow: React.ReactElement[] = [
    React.createElement(
      "tui-text",
      { key: "icon", color: iconColor },
      `${searchIcon} `,
    ),
    queryDisplay,
  ];
  if (cursor) inputRow.push(cursor);
  if (showResultCount && query.length > 0) {
    inputRow.push(
      React.createElement(
        "tui-text",
        { key: "count", color: colors.text.dim, dim: true },
        ` ${filteredItems.length} result${filteredItems.length === 1 ? "" : "s"}`,
      ),
    );
  }

  const showList = !(hideListUntilQuery && query.length === 0);
  const listElements: React.ReactElement[] = [];

  if (showList) {
    if (filteredItems.length === 0) {
      listElements.push(
        React.createElement(
          "tui-text",
          { key: "empty", color: colors.text.dim, dim: true },
          query.length > 0 ? "  No matches" : "  No options",
        ),
      );
    } else {
      const { start, end } = computeScrollWindow(
        filteredItems.length,
        activeIndexRef.current,
        maxVisible,
      );
      const visible = filteredItems.slice(start, end);
      const overflowTop = start > 0;
      const overflowBottom = end < filteredItems.length;

      if (overflowTop) {
        listElements.push(
          React.createElement(
            "tui-text",
            { key: "__top-ovf", color: colors.text.dim, dim: true },
            "  ···",
          ),
        );
      }

      visible.forEach((item, i) => {
        const index = start + i;
        const isActive = index === activeIndexRef.current;
        const disabled = !!item.disabled;
        const indicatorStr = isActive ? `${selectionChar} ` : "  ";
        let textColor: string | number = colors.text.primary;
        if (disabled) textColor = colors.text.disabled;
        else if (isActive) textColor = activeColor;

        if (item.richLabel && !disabled) {
          listElements.push(
            React.createElement(
              "tui-box",
              { key: item.value, flexDirection: "row" },
              React.createElement(
                "tui-text",
                { key: "ind", color: isActive ? activeColor : textColor, bold: isActive },
                indicatorStr,
              ),
              React.createElement(React.Fragment, { key: "rich" }, item.richLabel),
            ),
          );
        } else {
          listElements.push(
            React.createElement(
              "tui-text",
              {
                key: item.value,
                color: textColor,
                bold: isActive,
                dim: disabled,
                strikethrough: disabled,
              },
              `${indicatorStr}${item.label}`,
            ),
          );
        }
      });

      if (overflowBottom) {
        listElements.push(
          React.createElement(
            "tui-text",
            { key: "__bot-ovf", color: colors.text.dim, dim: true },
            "  ···",
          ),
        );
      }
    }
  }

  return React.createElement(
    "tui-box",
    {
      role: "combobox",
      flexDirection: "column",
      "aria-label": props["aria-label"],
      ...pickLayoutProps(props),
    },
    React.createElement(
      "tui-box",
      { key: "input", flexDirection: "row", role: "search" },
      ...inputRow,
    ),
    ...listElements,
  );
}
