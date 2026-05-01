import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createElement } from "react";
import { CliError } from "../errors.js";

export async function loadEntry(entryPath: string, env: Record<string, string>): Promise<unknown> {
  if (!existsSync(entryPath)) {
    throw new CliError(`could not load entry \`${entryPath}\`: no such file`, {
      hint: `relative paths resolve from cwd (${process.cwd()})`,
      exitCode: 2,
    });
  }
  for (const [k, v] of Object.entries(env)) process.env[k] = v as string;
  const url = pathToFileURL(entryPath).href + `?t=${Date.now()}`;
  const mod = await import(url);
  const Default = mod.default;
  if (!Default) throw new CliError(`entry \`${entryPath}\` has no default export`);
  return typeof Default === "function" ? createElement(Default) : Default;
}
