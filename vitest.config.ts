import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/__tests__/**/*.test.ts", "src/cli/__tests__/**/*.test.ts", "tests/smoke/**/*.test.ts"],
    environment: "node",
  },
});
