import { readFileSync } from "node:fs";
import path from "node:path";
import React from "react";
import { describe, expect, it } from "vitest";
import { Box, Text } from "../components/index.js";
import { useLayoutBox, useMeasure, useMouseTarget } from "../hooks/index.js";
import { renderForTest } from "../testing/index.js";

describe("layout box API", () => {
  it("measures a Box by public measureId", () => {
    function Probe(): React.ReactElement {
      const layout = useMeasure("probe-box");
      return React.createElement(
        Box,
        { flexDirection: "column" },
        React.createElement(Text, null, layout
          ? `measure:${layout.width}x${layout.height}:${layout.innerWidth}x${layout.innerHeight}`
          : "measure:none"),
        React.createElement(
          Box,
          { measureId: "probe-box", width: 12, height: 3, paddingX: 1 },
          React.createElement(Text, null, "target"),
        ),
      );
    }

    const result = renderForTest(React.createElement(Probe), { width: 40, height: 8 });

    expect(result.hasText("measure:none")).toBe(true);

    result.rerender(React.createElement(Probe));

    expect(result.hasText("measure:12x3:10x3")).toBe(true);
  });

  it("returns fallback first and measured layout after paint", () => {
    function Probe(): React.ReactElement {
      const box = useLayoutBox({
        fallback: {
          width: 9,
          height: 2,
          innerWidth: 7,
          innerHeight: 2,
        },
      });

      return React.createElement(
        Box,
        { flexDirection: "column" },
        React.createElement(
          Text,
          null,
          `${box.measured ? "measured" : "fallback"}:${box.rect.width}x${box.rect.height}:${box.rect.innerWidth}x${box.rect.innerHeight}`,
        ),
        React.createElement(
          Box,
          { ...box.layoutProps, width: 20, height: 4, paddingX: 1 },
          React.createElement(Text, null, "slot"),
        ),
      );
    }

    const result = renderForTest(React.createElement(Probe), { width: 50, height: 8 });

    expect(result.hasText("fallback:9x2:7x2")).toBe(true);

    result.rerender(React.createElement(Probe));

    expect(result.hasText("measured:20x4:18x4")).toBe(true);
  });

  it("attaches mouse target bounds through targetProps", () => {
    const hits: string[] = [];

    function Probe(): React.ReactElement {
      const mouse = useMouseTarget({
        onMouse: (event, localX, localY) => {
          if (event.button === "left" && event.action === "press") {
            hits.push(`${localX},${localY}`);
          }
        },
      });

      return React.createElement(
        Box,
        { ...mouse.targetProps, width: 10, height: 3 },
        React.createElement(Text, null, "clickable"),
      );
    }

    const result = renderForTest(React.createElement(Probe), { width: 30, height: 6 });

    result.click(2, 1);

    expect(hits).toEqual(["2,1"]);
  });

  it("keeps component code on public measurement and mouse target props", () => {
    const files = [
      "src/components/core/Button.tsx",
      "src/components/core/Checkbox.tsx",
      "src/components/core/ProgressBar.tsx",
      "src/components/core/Switch.tsx",
      "src/components/core/Tabs.tsx",
      "src/components/data/Gauge.tsx",
      "src/components/data/Sparkline.tsx",
      "src/components/data/Tree.tsx",
      "src/components/data/TreeTable.tsx",
      "src/components/effects/GradientProgress.tsx",
      "src/components/table/Table.tsx",
      "examples/reacterm-demo.tsx",
    ];

    const offenders: string[] = [];
    for (const file of files) {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");
      if (/\b_measureId\b/.test(source)) {
        offenders.push(`${file}: uses _measureId instead of measureId`);
      }
      if (/\b_focusId\s*:\s*(?:mouseTarget|target)\.focusId\b/.test(source)) {
        offenders.push(`${file}: uses focusId directly instead of targetProps`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
