#!/usr/bin/env npx tsx

import { pathToFileURL } from "node:url";
import { App } from "../src/cli/demo/App.js";
import { runDemoApp } from "../src/cli/demo/main.js";

export { App };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runDemoApp()
    .then((code) => process.exit(code))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      process.stderr.write(`${message}\n`);
      process.exit(1);
    });
}
