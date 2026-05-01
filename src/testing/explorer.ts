import React from "react";
import { renderDriver } from "./driver.js";

export type ExplorerAction = "tab" | "enter" | "escape" | "up" | "down" | "left" | "right";

export interface ExplorerOptions {
  terminal?: { width?: number; height?: number };
  maxDepth?: number;
  actions?: ExplorerAction[];
}

export interface ExplorerReport {
  framesVisited: number;
  actionsTried: number;
  failures: string[];
  visitedHashes: string[];
}

export async function exploreForTest(element: React.ReactElement, options: ExplorerOptions = {}): Promise<ExplorerReport> {
  const driverOptions: Parameters<typeof renderDriver>[1] = {};
  if (options.terminal?.width !== undefined) driverOptions.width = options.terminal.width;
  if (options.terminal?.height !== undefined) driverOptions.height = options.terminal.height;
  const driver = renderDriver(element, driverOptions);
  const maxDepth = options.maxDepth ?? 20;
  const actions = options.actions ?? ["tab", "enter", "escape", "up", "down"];
  const visited = new Set<string>();
  const failures: string[] = [];
  let actionsTried = 0;

  try {
    for (let i = 0; i < maxDepth; i++) {
      visited.add(driver.metadata.screenHash);
      const action = actions[i % actions.length]!;
      try {
        driver.press(action);
        actionsTried++;
        visited.add(driver.metadata.screenHash);
        collectInvariantFailures(driver.output, driver.metadata.warnings, failures);
      } catch (error) {
        failures.push(error instanceof Error ? error.message : String(error));
      }
    }
    return {
      framesVisited: visited.size,
      actionsTried,
      failures,
      visitedHashes: [...visited],
    };
  } finally {
    driver.unmount();
  }
}

function collectInvariantFailures(output: string, warnings: string[], failures: string[]): void {
  if (output.trim().length === 0) failures.push("not-blank invariant failed");
  if (warnings.length > 0) failures.push(`no-warning invariant failed: ${warnings.join("; ")}`);
}
