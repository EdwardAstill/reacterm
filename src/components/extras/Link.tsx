import React from "react";
import type { StormTextStyleProps } from "../../styles/styleProps.js";
import { usePersonality } from "../../core/personality.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";

export interface LinkProps extends StormTextStyleProps {
  url: string;
  children: React.ReactNode;
}

/**
 * Allowed URL schemes for `<Link>`. Reacterm forwards `url` directly into an
 * OSC 8 hyperlink sequence, which terminals dispatch through their own URL
 * handlers — `javascript:`, `file:`, `data:`, and similar schemes can produce
 * unwanted side effects depending on the terminal. Anything outside this list
 * is dropped (the link renders as plain text) and a one-time dev warning fires.
 */
export const ALLOWED_LINK_SCHEMES = Object.freeze([
  "http:",
  "https:",
  "mailto:",
  "ftp:",
  "ftps:",
  "tel:",
  "ssh:",
] as const);

const SCHEME_RE = /^[a-z][a-z0-9+.\-]*:/i;

/**
 * Returns true when `url` begins with a scheme in `ALLOWED_LINK_SCHEMES`.
 * Relative URLs, fragment-only URLs, and unknown schemes return false.
 */
export function isAllowedLinkScheme(url: string): boolean {
  if (typeof url !== "string" || url.length === 0) return false;
  const match = SCHEME_RE.exec(url);
  if (!match) return false;
  const scheme = match[0].toLowerCase();
  return (ALLOWED_LINK_SCHEMES as readonly string[]).includes(scheme);
}

const warnedUrls = new Set<string>();

function warnDisallowedScheme(url: string): void {
  if (process.env.NODE_ENV === "production") return;
  if (warnedUrls.has(url)) return;
  warnedUrls.add(url);
  // eslint-disable-next-line no-console
  console.warn(
    `[reacterm] <Link url=${JSON.stringify(url)}>: scheme not in allowlist (${ALLOWED_LINK_SCHEMES.join(", ")}). Rendering as plain text.`,
  );
}

export const Link = React.memo(function Link(rawProps: LinkProps): React.ReactElement {
  const props = usePluginProps("Link", rawProps);
  const personality = usePersonality();
  const { url, children, color, bold, dim } = props;

  const safeUrl = isAllowedLinkScheme(url) ? url : null;
  if (safeUrl === null && url) warnDisallowedScheme(url);

  return React.createElement(
    "tui-text",
    {
      color: color ?? personality.typography.linkColor,
      underline: personality.typography.linkUnderline,
      ...(bold !== undefined ? { bold } : {}),
      ...(dim !== undefined ? { dim } : {}),
      ...(safeUrl !== null ? { _linkUrl: safeUrl } : {}),
    },
    children,
  );
});
