/**
 * MarkdownEditor showcase — split-pane editor + live preview.
 * Type on the left, watch the right re-parse after the debounce.
 * Tab cycles focus between editor and preview.
 */

import React, { useState } from "react";
import { render, MarkdownEditor } from "reacterm";

const initial = `# Hello

Edit me on the **left** and watch the preview update on the right.

| col | val |
|-----|-----|
| a   | 1   |
| b   | 2   |

- task one
- [x] task two

\`\`\`ts
const x: number = 42;
\`\`\`
`;

function App() {
  const [text, setText] = useState(initial);
  return React.createElement(MarkdownEditor, {
    value: text,
    onChange: setText,
    previewDelayMs: 150,
    rows: 20,
  });
}

render(React.createElement(App));
