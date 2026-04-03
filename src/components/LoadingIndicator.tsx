/**
 * LoadingIndicator — full-area animated loading state.
 *
 * Takes over a section or screen with a centered loading animation,
 * optional message and subtitle. Supports multiple animation styles
 * (spinner, dots, bar, pulse, gradient) and a determinate progress mode.
 *
 * Uses imperative ref mutation + requestRender() for high-frequency
 * animation frames. No useState for animation state.
 */

import React, { useRef } from "react";
import { useTick } from "../hooks/useTick.js";
import { useColors } from "../hooks/useColors.js";
import { usePluginProps } from "../hooks/usePluginProps.js";
import { usePersonality } from "../core/personality.js";
import { interpolateColor } from "./Gradient.js";
import type { StormLayoutStyleProps } from "../styles/styleProps.js";

export type LoadingStyle = "spinner" | "dots" | "bar" | "pulse" | "gradient";
export type LoadingSize = "sm" | "md" | "lg";

export interface LoadingIndicatorProps extends StormLayoutStyleProps {
  /** Animation style. @default "spinner" */
  style?: LoadingStyle;
  /** Size of the animation area. @default "md" */
  size?: LoadingSize;
  /** Primary message shown below the animation. */
  message?: string;
  /** Dimmer subtitle shown below the message. */
  subtitle?: string;
  /** When provided (0-1), switches to determinate progress mode. */
  progress?: number;
  /** Override animation speed in ms. @default personality-based */
  interval?: number;
  /** Whether animation is active. @default true */
  active?: boolean;
  /** Custom gradient colors for "gradient" style. */
  gradientColors?: string[];
}

// ── Animation frame sets ────────────────────────────────────────────

const SPINNER_FRAMES = {
  sm: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  md: ["◐", "◓", "◑", "◒"],
  lg: ["◜ ", " ◝", " ◞", "◟ "],
};

const DOTS_FRAMES = {
  sm: ["·  ", "·· ", "···", " ··", "  ·", "   "],
  md: ["⠁   ", "⠃   ", "⠇   ", "⠇⠁  ", "⠇⠃  ", "⠇⠇  ", " ⠇⠇ ", "  ⠇⠇", "   ⠇", "    "],
  lg: [
    "●○○○○", "○●○○○", "○○●○○", "○○○●○", "○○○○●",
    "○○○●○", "○○●○○", "○●○○○",
  ],
};

const BAR_FRAMES_SM = ["▏", "▎", "▍", "▌", "▋", "▊", "▉", "█", "▉", "▊", "▋", "▌", "▍", "▎", "▏"];

const PULSE_CHARS = ["░", "▒", "▓", "█", "▓", "▒"];

// ── Helpers ─────────────────────────────────────────────────────────

function buildBarFrame(tick: number, barWidth: number): { filled: string; empty: string } {
  const cycle = barWidth * 2;
  const pos = tick % cycle;
  const indicatorW = Math.max(1, Math.floor(barWidth / 4));
  const actualPos = pos < barWidth
    ? pos
    : cycle - pos;
  const clamped = Math.min(actualPos, barWidth - indicatorW);
  const before = "░".repeat(Math.max(0, clamped));
  const indicator = "█".repeat(indicatorW);
  const after = "░".repeat(Math.max(0, barWidth - clamped - indicatorW));
  return { filled: before + indicator + after, empty: "" };
}

function buildPulseFrame(tick: number, pulseWidth: number): string {
  const chars: string[] = [];
  for (let i = 0; i < pulseWidth; i++) {
    const offset = (tick + i) % PULSE_CHARS.length;
    chars.push(PULSE_CHARS[offset]!);
  }
  return chars.join("");
}

function buildGradientFrame(
  tick: number,
  barWidth: number,
  stops: string[],
): Array<{ char: string; color: string }> {
  const result: Array<{ char: string; color: string }> = [];
  const shift = (tick * 0.05) % 1;
  for (let i = 0; i < barWidth; i++) {
    const t = ((i / Math.max(1, barWidth - 1)) + shift) % 1;
    const color = getColorAt(stops, t);
    const charIdx = (tick + i) % PULSE_CHARS.length;
    result.push({ char: PULSE_CHARS[charIdx]!, color });
  }
  return result;
}

function buildProgressBar(
  progress: number,
  barWidth: number,
  filledColor: string,
  emptyColor: string,
): Array<{ char: string; color: string }> {
  const clamped = Math.max(0, Math.min(1, progress));
  const filled = Math.round(clamped * barWidth);
  const result: Array<{ char: string; color: string }> = [];
  for (let i = 0; i < barWidth; i++) {
    if (i < filled) {
      result.push({ char: "█", color: filledColor });
    } else {
      result.push({ char: "░", color: emptyColor });
    }
  }
  return result;
}

function getColorAt(stops: string[], position: number): string {
  if (stops.length === 0) return "#FFFFFF";
  if (stops.length === 1) return stops[0]!;
  if (stops.length === 2) return interpolateColor(stops[0]!, stops[1]!, position);

  const clamped = Math.max(0, Math.min(1, position));
  const segments = stops.length - 1;
  const scaledPos = clamped * segments;
  const segIndex = Math.min(Math.floor(scaledPos), segments - 1);
  const t = scaledPos - segIndex;
  return interpolateColor(stops[segIndex]!, stops[segIndex + 1]!, t);
}

// ── Size-dependent dimensions ───────────────────────────────────────

const SIZE_CONFIG: Record<LoadingSize, { barWidth: number; pulseWidth: number; paddingY: number }> = {
  sm: { barWidth: 10, pulseWidth: 6, paddingY: 0 },
  md: { barWidth: 20, pulseWidth: 12, paddingY: 1 },
  lg: { barWidth: 32, pulseWidth: 20, paddingY: 2 },
};

// ── Component ───────────────────────────────────────────────────────

export const LoadingIndicator = React.memo(function LoadingIndicator(
  rawProps: LoadingIndicatorProps,
): React.ReactElement {
  const colors = useColors();
  const props = usePluginProps(
    "LoadingIndicator",
    rawProps as unknown as Record<string, unknown>,
  ) as unknown as LoadingIndicatorProps;
  const personality = usePersonality();

  const {
    style: animStyle = "spinner",
    size = "md",
    message,
    subtitle,
    progress,
    interval = personality.animation.durationNormal > 0
      ? Math.max(40, personality.animation.durationNormal / 3)
      : 80,
    active = true,
    gradientColors,
    width,
    height,
    margin,
    marginX,
    marginY,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    minWidth,
    maxWidth,
    color = colors.brand.primary,
  } = props;

  const tickRef = useRef(0);

  useTick(interval, (tick) => {
    tickRef.current = tick;
  }, { active, reactive: true });

  const tick = tickRef.current;
  const sizeConf = SIZE_CONFIG[size];
  const isDeterminate = progress !== undefined;

  // ── Build animation row ───────────────────────────────────────

  const animChildren: React.ReactElement[] = [];

  if (isDeterminate) {
    // Determinate progress bar mode
    const barWidth = sizeConf.barWidth;
    const segments = buildProgressBar(
      progress,
      barWidth,
      typeof color === "string" ? color : colors.brand.primary,
      colors.text.dim,
    );
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]!;
      animChildren.push(
        React.createElement("tui-text", { key: `p${i}`, color: seg.color }, seg.char),
      );
    }
    const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);
    animChildren.push(
      React.createElement("tui-text", { key: "pct", bold: true }, ` ${pct}%`),
    );
  } else if (animStyle === "spinner") {
    const frames = SPINNER_FRAMES[size];
    const frame = frames[tick % frames.length]!;
    animChildren.push(
      React.createElement("tui-text", { key: "spin", color, bold: true }, frame),
    );
  } else if (animStyle === "dots") {
    const frames = DOTS_FRAMES[size];
    const frame = frames[tick % frames.length]!;
    animChildren.push(
      React.createElement("tui-text", { key: "dots", color, bold: true }, frame),
    );
  } else if (animStyle === "bar") {
    if (size === "sm") {
      const frame = BAR_FRAMES_SM[tick % BAR_FRAMES_SM.length]!;
      animChildren.push(
        React.createElement("tui-text", { key: "bar", color, bold: true }, frame),
      );
    } else {
      const { filled } = buildBarFrame(tick, sizeConf.barWidth);
      animChildren.push(
        React.createElement("tui-text", { key: "bar", color }, filled),
      );
    }
  } else if (animStyle === "pulse") {
    const pulseStr = buildPulseFrame(tick, sizeConf.pulseWidth);
    animChildren.push(
      React.createElement("tui-text", { key: "pulse", color, bold: true }, pulseStr),
    );
  } else if (animStyle === "gradient") {
    const stops = gradientColors && gradientColors.length >= 2
      ? gradientColors
      : [colors.brand.primary, colors.brand.glow];
    const segments = buildGradientFrame(tick, sizeConf.barWidth, stops);
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]!;
      animChildren.push(
        React.createElement("tui-text", { key: `g${i}`, color: seg.color }, seg.char),
      );
    }
  }

  // ── Assemble rows ─────────────────────────────────────────────

  const rows: React.ReactElement[] = [];

  // Animation row — centered
  rows.push(
    React.createElement(
      "tui-box",
      { key: "anim", flexDirection: "row", justifyContent: "center" },
      ...animChildren,
    ),
  );

  // Message row
  if (message !== undefined) {
    rows.push(
      React.createElement(
        "tui-box",
        { key: "msg", justifyContent: "center", marginTop: 1 },
        React.createElement(
          "tui-text",
          { color: colors.text.primary, bold: size === "lg" },
          message,
        ),
      ),
    );
  }

  // Subtitle row
  if (subtitle !== undefined) {
    rows.push(
      React.createElement(
        "tui-box",
        { key: "sub", justifyContent: "center", ...(message !== undefined ? {} : { marginTop: 1 }) },
        React.createElement(
          "tui-text",
          { color: colors.text.dim, dim: true },
          subtitle,
        ),
      ),
    );
  }

  // ── Outer container — centered in available space ─────────────

  const outerBoxProps: Record<string, unknown> = {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
    ...(margin !== undefined ? { margin } : {}),
    ...(marginX !== undefined ? { marginX } : {}),
    ...(marginY !== undefined ? { marginY } : {}),
    ...(marginTop !== undefined ? { marginTop } : {}),
    ...(marginBottom !== undefined ? { marginBottom } : {}),
    ...(marginLeft !== undefined ? { marginLeft } : {}),
    ...(marginRight !== undefined ? { marginRight } : {}),
    ...(minWidth !== undefined ? { minWidth } : {}),
    ...(maxWidth !== undefined ? { maxWidth } : {}),
    ...(sizeConf.paddingY > 0 ? { paddingY: sizeConf.paddingY } : {}),
  };

  return React.createElement("tui-box", outerBoxProps, ...rows);
});
