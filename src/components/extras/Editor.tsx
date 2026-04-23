import React from "react";
import { useColors } from "../../hooks/useColors.js";
import { useStyles } from "../../core/style-provider.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { usePersonality } from "../../core/personality.js";
import { mergeBoxStyles, pickStyleProps } from "../../styles/applyStyles.js";
import type { StormContainerStyleProps, StormLayoutStyleProps } from "../../styles/styleProps.js";
import { Divider } from "../core/Divider.js";
import { TextArea, type HighlightSpan, type TextAreaProps } from "../core/TextArea.js";
import { createSyntaxHighlightLines } from "../../widgets/dev/SyntaxHighlight.js";

type EditorTextAreaProps = Omit<TextAreaProps, keyof StormLayoutStyleProps | "highlight" | "flex">;

export interface EditorProps extends StormContainerStyleProps, EditorTextAreaProps {
  /** Title shown in the editor header. @default "Editor" */
  title?: string;
  /** Language identifier used for the header badge and built-in syntax highlighting. */
  language?: string;
  /** Number of visible editor rows. @default 12 */
  rows?: number;
  /** Whether to show the header row. @default true */
  showHeader?: boolean;
  /** Whether to show the footer/status row. @default true */
  showFooter?: boolean;
  /** Custom footer content. When omitted, a default status line is rendered. */
  footer?: React.ReactNode;
  /** Optional syntax highlighter override. Takes precedence over `language`. */
  highlight?: (line: string, lineIndex: number) => HighlightSpan[];
}

export const Editor = React.memo(function Editor(rawProps: EditorProps): React.ReactElement {
  const colors = useColors();
  const personality = usePersonality();
  const props = usePluginProps("Editor", rawProps);

  const {
    title = "Editor",
    language,
    rows = 12,
    showHeader = true,
    showFooter = true,
    footer,
    value,
    onChange,
    onSubmit,
    submitKey = "ctrl+enter",
    placeholder,
    isFocused = true,
    readOnly = false,
    disabled = false,
    lineNumbers = true,
    wordWrap = false,
    tabSize = 2,
    maxLength,
    color,
    placeholderColor,
    lineNumberColor,
    onSelectionChange,
    highlight,
    className,
    id,
    "aria-label": ariaLabel,
  } = props;

  const ssStates = new Set<string>();
  if (isFocused) ssStates.add("focused");
  if (readOnly) ssStates.add("readonly");
  if (disabled) ssStates.add("disabled");
  const ssStyles = useStyles("Editor", className, id, ssStates);
  const userStyles = pickStyleProps(props);

  const boxProps = mergeBoxStyles(
    mergeBoxStyles(
      {
        flexDirection: "column",
        borderStyle: personality.borders.panel,
        borderColor: colors.divider,
        backgroundColor: colors.surface.overlay,
        opaque: true,
      },
      ssStyles as Record<string, unknown>,
    ),
    userStyles,
  );

  const syntaxLines = React.useMemo(() => {
    if (!language || highlight) return null;
    return createSyntaxHighlightLines(value, language, colors);
  }, [colors, highlight, language, value]);

  const resolvedHighlight = React.useMemo(() => {
    if (highlight) return highlight;
    if (!syntaxLines) return undefined;
    return (_line: string, lineIndex: number): HighlightSpan[] => syntaxLines[lineIndex] ?? [];
  }, [highlight, syntaxLines]);

  const lineCount = value.length === 0 ? 1 : value.split("\n").length;
  const footerNode = footer !== undefined
    ? footer
    : [
        language,
        `${lineCount} line${lineCount === 1 ? "" : "s"}`,
        `${value.length} char${value.length === 1 ? "" : "s"}`,
        wordWrap ? "wrap on" : "wrap off",
        readOnly ? "read only" : "editable",
      ].filter(Boolean).join(" • ");

  const headerMeta = [
    language ? language.toUpperCase() : undefined,
    readOnly ? "READ ONLY" : undefined,
    disabled ? "DISABLED" : undefined,
  ].filter(Boolean).join(" • ");

  const children: React.ReactElement[] = [];

  if (showHeader) {
    const headerChildren: React.ReactElement[] = [
      React.createElement(
        "tui-text",
        { key: "title", bold: true, color: colors.text.primary },
        title,
      ),
    ];

    if (headerMeta.length > 0) {
      headerChildren.push(
        React.createElement("tui-box", { key: "spacer", flex: 1 }),
      );
      headerChildren.push(
        React.createElement(
          "tui-text",
          { key: "meta", color: colors.text.secondary, dim: true },
          headerMeta,
        ),
      );
    }

    children.push(
      React.createElement(
        "tui-box",
        { key: "header", flexDirection: "row", paddingLeft: 1, paddingRight: 1, paddingTop: 0, paddingBottom: 0 },
        ...headerChildren,
      ),
    );
    children.push(
      React.createElement(Divider, { key: "header-divider" }),
    );
  }

  children.push(
    React.createElement(
      "tui-box",
      {
        key: "body",
        flexDirection: "column",
        height: rows,
        paddingLeft: 1,
        paddingRight: 1,
      },
      React.createElement(TextArea, {
        value,
        onChange,
        ...(onSubmit ? { onSubmit } : {}),
        submitKey,
        ...(placeholder !== undefined ? { placeholder } : {}),
        isFocused,
        readOnly,
        disabled,
        lineNumbers,
        wordWrap,
        tabSize,
        maxLines: rows,
        ...(maxLength !== undefined ? { maxLength } : {}),
        ...(color !== undefined ? { color } : {}),
        ...(placeholderColor !== undefined ? { placeholderColor } : {}),
        ...(lineNumberColor !== undefined ? { lineNumberColor } : {}),
        ...(onSelectionChange ? { onSelectionChange } : {}),
        ...(resolvedHighlight ? { highlight: resolvedHighlight } : {}),
        flex: 1,
        "aria-label": ariaLabel ?? title,
      }),
    ),
  );

  if (showFooter) {
    children.push(
      React.createElement(Divider, { key: "footer-divider" }),
    );
    children.push(
      React.createElement(
        "tui-box",
        { key: "footer", flexDirection: "row", paddingLeft: 1, paddingRight: 1 },
        typeof footerNode === "string"
          ? React.createElement(
              "tui-text",
              { color: colors.text.dim, dim: true },
              footerNode || " ",
            )
          : React.createElement(React.Fragment, null, footerNode),
      ),
    );
  }

  return React.createElement("tui-box", boxProps, ...children);
});
