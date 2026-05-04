import React from "react";
import { pathToFileURL } from "node:url";
import { render } from "../../index.js";
import { App } from "./App.js";

export async function runDemoApp(): Promise<number> {
  const app = render(React.createElement(App));
  if (process.env.REACTERM_DEMO_SMOKE === "1") {
    setTimeout(() => app.unmount(), 50);
  }
  await app.waitUntilExit();
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runDemoApp()
    .then((code) => process.exit(code))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      process.stderr.write(`${message}\n`);
      process.exit(1);
    });
}
