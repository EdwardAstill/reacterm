import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/smoke/published-package.test.ts"],
    environment: "node",
  },
});
