/**
 * Locks the structural invariant that user-supplied strings cannot inject
 * active terminal control sequences via <Text> rendering.
 *
 * Reacterm's renderer strips ANSI from text props at ingestion (see
 * src/reconciler/renderer.ts stripAnsi call) and stores characters as
 * codepoints in a cell grid (Uint32Array in src/core/buffer.ts). These tests
 * fail loudly if a future refactor regresses either guarantee.
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { renderForTest } from "../testing/index.js";
import { Text } from "../components/index.js";

const ESC = "\x1b";

function containsEsc(s: string): boolean {
  return s.includes(ESC);
}

describe("text injection safety", () => {
  it("strips CSI sequences (color/style) from <Text> children", () => {
    const injected = `before${ESC}[31mRED${ESC}[0m after`;
    const result = renderForTest(
      React.createElement(Text, null, injected),
      { width: 40, height: 3 },
    );

    expect(containsEsc(result.output)).toBe(false);
    expect(result.hasText("before")).toBe(true);
    expect(result.hasText("after")).toBe(true);

    // Reacterm-generated style escapes appear in styledOutput as full SGR
    // sequences (CSI ... m); a leftover injected red would be the same shape,
    // so we check that the literal "RED" run is not flanked by a 31m-introducing
    // SGR that didn't originate from a <Text color="red"> in this tree.
    const styled = result.styledOutput;
    // No SGR setting foreground red (31) should appear, since we never asked
    // for a red color and the injected one must have been stripped.
    expect(styled).not.toMatch(/\x1b\[[^m]*?31m/);
  });

  it("strips OSC 8 hyperlink sequences from <Text> children", () => {
    const malicious = `${ESC}]8;;javascript:alert(1)${ESC}\\click here${ESC}]8;;${ESC}\\`;
    const result = renderForTest(
      React.createElement(Text, null, malicious),
      { width: 40, height: 3 },
    );

    expect(containsEsc(result.output)).toBe(false);
    // OSC 8 introducer "]8;" must not survive in any form
    expect(result.styledOutput).not.toMatch(/\x1b\]8;/);
    // No link metadata should appear in semantic metadata either.
    const linkNodes = result.metadata.semanticNodes.filter(
      (node) => node.type === "link" || (node.props && "linkUrl" in node.props),
    );
    expect(linkNodes).toEqual([]);
  });

  it("strips OSC 52 clipboard sequences from <Text> children", () => {
    const exploit = `${ESC}]52;c;ZXhwbG9pdA==${ESC}\\`;
    const result = renderForTest(
      React.createElement(Text, null, exploit),
      { width: 40, height: 3 },
    );

    expect(containsEsc(result.output)).toBe(false);
    expect(result.styledOutput).not.toMatch(/\x1b\]52;/);
  });

  it("strips bare C0 escape bytes from <Text> children", () => {
    const noisy = `pre${ESC}post`;
    const result = renderForTest(
      React.createElement(Text, null, noisy),
      { width: 40, height: 3 },
    );

    expect(containsEsc(result.output)).toBe(false);
    expect(result.hasText("pre")).toBe(true);
    expect(result.hasText("post")).toBe(true);
  });
});
