export interface BrailleChartMetrics {
  gutterWidth: number;
  chartCols: number;
  chartRows: number;
  pixelWidth: number;
  pixelHeight: number;
}

export function getBrailleChartMetrics(
  cellWidth: number,
  cellHeight: number,
  gutterWidth: number,
): BrailleChartMetrics {
  const chartCols = Math.max(1, cellWidth - gutterWidth);
  const chartRows = Math.max(1, cellHeight);
  return {
    gutterWidth,
    chartCols,
    chartRows,
    pixelWidth: chartCols * 2,
    pixelHeight: chartRows * 4,
  };
}

export function formatFixedChartValue(
  value: number,
  width: number,
  options?: { padStart?: boolean },
): string {
  let str: string;

  if (value === 0) {
    str = "0";
  } else if (Math.abs(value) >= 1_000_000) {
    str = (value / 1_000_000).toFixed(1) + "M";
  } else if (Math.abs(value) >= 10_000) {
    str = (value / 1_000).toFixed(1) + "k";
  } else if (Math.abs(value) >= 1_000) {
    str = (value / 1_000).toFixed(2) + "k";
  } else if (Number.isInteger(value)) {
    str = String(value);
  } else {
    str = value.toFixed(1);
  }

  if (str.length > width) {
    str = str.slice(0, width);
  }
  return options?.padStart === true ? str.padStart(width) : str;
}

export function formatLegendNumber(value: number): string {
  if (value === 0) return "0";
  if (Math.abs(value) >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
  if (Math.abs(value) >= 1_000) return (value / 1_000).toFixed(1) + "k";
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1);
}
