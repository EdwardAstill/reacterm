import { describe, expect, it } from "vitest";

import {
  formatFixedChartValue,
  formatLegendNumber,
  getBrailleChartMetrics,
} from "../components/data/chart-core/format.js";

describe("chart-core helpers", () => {
  it("computes braille chart metrics from cell dimensions and axis gutter", () => {
    expect(getBrailleChartMetrics(60, 10, 7)).toEqual({
      gutterWidth: 7,
      chartCols: 53,
      chartRows: 10,
      pixelWidth: 106,
      pixelHeight: 40,
    });

    expect(getBrailleChartMetrics(4, 0, 7)).toEqual({
      gutterWidth: 7,
      chartCols: 1,
      chartRows: 1,
      pixelWidth: 2,
      pixelHeight: 4,
    });
  });

  it("formats fixed-width chart values", () => {
    expect(formatFixedChartValue(0, 4)).toBe("0");
    expect(formatFixedChartValue(12.34, 6)).toBe("12.3");
    expect(formatFixedChartValue(1234, 8)).toBe("1.23k");
    expect(formatFixedChartValue(12345, 8)).toBe("12.3k");
    expect(formatFixedChartValue(12, 4, { padStart: true })).toBe("  12");
    expect(formatFixedChartValue(1234567, 3)).toBe("1.2");
  });

  it("formats compact legend numbers", () => {
    expect(formatLegendNumber(0)).toBe("0");
    expect(formatLegendNumber(1500)).toBe("1.5k");
    expect(formatLegendNumber(1_250_000)).toBe("1.3M");
    expect(formatLegendNumber(12)).toBe("12");
    expect(formatLegendNumber(2.25)).toBe("2.3");
  });
});
