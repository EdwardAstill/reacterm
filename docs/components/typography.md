# Typography Components

Text rendering and markdown display.

## Typography

### MarkdownText

Renders markdown to styled TUI elements. Pure regex-based parser with no external dependencies.

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `string` | -- | Markdown source text (required) |
| `width` | `number` | -- | Wrap width |

Supports: headings, bold, italic, inline code, code blocks (with syntax highlighting), lists, blockquotes, links, horizontal rules.

```tsx
<MarkdownText>{`# Hello\n\nThis is **bold** and *italic* with \`code\`.`}</MarkdownText>
```

> **Note:** For Heading and Paragraph components, see the [Content](#content) section.

---

For AI/agent widgets (OperationTree, MessageBubble, StreamingText, etc.), see [widgets.md](widgets.md).

---
[Back to Components](README.md)
