/**
 * SearchTable component tests.
 *
 * Pin down the SearchTable contract: filter rows by substring across configurable
 * columns, case-insensitive by default, custom predicate override, and — critically —
 * row-index translation so onRowSelect/onRowPress/onCellPress receive the original
 * row index from the unfiltered data array, not the filtered position.
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { renderForTest } from "../testing/index.js";
import { SearchTable } from "../components/extras/SearchTable.js";

const columns = [
  { key: "name", header: "Name" },
  { key: "city", header: "City" },
  { key: "score", header: "Score" },
];

const data = [
  { name: "Alice",   city: "Boston",      score: 95 },
  { name: "Bob",     city: "Albany",      score: 87 },
  { name: "Carol",   city: "Chicago",     score: 72 },
  { name: "Dave",    city: "Boston",      score: 64 },
];

describe("SearchTable", () => {
  it("renders all rows when query is empty", () => {
    const result = renderForTest(
      React.createElement(SearchTable, { columns, data, isFocused: true }),
      { width: 60, height: 20 },
    );
    expect(result.hasText("Alice")).toBe(true);
    expect(result.hasText("Bob")).toBe(true);
    expect(result.hasText("Carol")).toBe(true);
    expect(result.hasText("Dave")).toBe(true);
  });

  it("filters rows by substring across all string columns by default", () => {
    const result = renderForTest(
      React.createElement(SearchTable, { columns, data, isFocused: true }),
      { width: 60, height: 20 },
    );
    result.type("bos");
    expect(result.hasText("Alice")).toBe(true);
    expect(result.hasText("Dave")).toBe(true);
    expect(result.hasText("Bob")).toBe(false);
    expect(result.hasText("Carol")).toBe(false);
  });

  it("honors searchableColumns — only listed columns participate in match", () => {
    const result = renderForTest(
      React.createElement(SearchTable, {
        columns,
        data,
        isFocused: true,
        searchableColumns: ["name"],
      }),
      { width: 60, height: 20 },
    );
    // "bos" appears in city but not in any name; with searchableColumns=["name"] no rows match.
    result.type("bos");
    expect(result.hasText("Alice")).toBe(false);
    expect(result.hasText("Dave")).toBe(false);
  });

  it("is case-insensitive by default", () => {
    const result = renderForTest(
      React.createElement(SearchTable, { columns, data, isFocused: true }),
      { width: 60, height: 20 },
    );
    result.type("ALICE");
    expect(result.hasText("Alice")).toBe(true);
    expect(result.hasText("Bob")).toBe(false);
  });

  it("respects caseSensitive=true", () => {
    const result = renderForTest(
      React.createElement(SearchTable, {
        columns,
        data,
        isFocused: true,
        caseSensitive: true,
      }),
      { width: 60, height: 20 },
    );
    result.type("ALICE");
    // Case-sensitive: "ALICE" does not match "Alice".
    expect(result.hasText("Alice")).toBe(false);
  });

  it("custom filter predicate overrides default match logic", () => {
    const result = renderForTest(
      React.createElement(SearchTable, {
        columns,
        data,
        isFocused: true,
        filter: (row, q) => String(row.score).startsWith(q),
      }),
      { width: 60, height: 20 },
    );
    result.type("9");
    expect(result.hasText("Alice")).toBe(true);  // score 95
    expect(result.hasText("Bob")).toBe(false);
    expect(result.hasText("Carol")).toBe(false);
    expect(result.hasText("Dave")).toBe(false);
  });

  it("onRowSelect receives the ORIGINAL row index, not the filtered index", () => {
    const selections: number[] = [];
    const result = renderForTest(
      React.createElement(SearchTable, {
        columns,
        data,
        isFocused: true,
        rowHighlight: true,
        onRowSelect: (rowIndex: number) => { selections.push(rowIndex); },
      }),
      { width: 60, height: 20 },
    );
    // Filter to rows that contain "carol" — only row index 2 in the original data.
    result.type("carol");
    // The Table sees a 1-row filtered array; cursor sits on the only row (filtered index 0).
    result.pressEnter();
    expect(selections).toEqual([2]);
  });

  it("displays result count when query non-empty and showResultCount is true", () => {
    const result = renderForTest(
      React.createElement(SearchTable, {
        columns,
        data,
        isFocused: true,
        showResultCount: true,
      }),
      { width: 60, height: 20 },
    );
    result.type("bos");
    expect(result.hasText("2 results")).toBe(true);
  });

  it("Escape on non-empty query clears buffer; on empty query fires onCancel", () => {
    let cancels = 0;
    const result = renderForTest(
      React.createElement(SearchTable, {
        columns,
        data,
        isFocused: true,
        onCancel: () => { cancels += 1; },
      }),
      { width: 60, height: 20 },
    );
    result.type("bos");
    expect(result.hasText("Carol")).toBe(false);
    result.pressEscape();
    // Buffer cleared — Carol visible again.
    expect(result.hasText("Carol")).toBe(true);
    expect(cancels).toBe(0);
    // Second escape on empty query fires onCancel.
    result.pressEscape();
    expect(cancels).toBe(1);
  });

  it("passes through Table props (rowHighlight, stripe) without breaking render", () => {
    const result = renderForTest(
      React.createElement(SearchTable, {
        columns,
        data,
        isFocused: true,
        rowHighlight: true,
        stripe: true,
      }),
      { width: 60, height: 20 },
    );
    expect(result.hasText("Alice")).toBe(true);
    expect(result.hasText("Name")).toBe(true);
  });
});
