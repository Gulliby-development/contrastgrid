import type { Color } from "./color";

export interface Ratings {
  aa: boolean;
  aaLarge: boolean;
  aaa: boolean;
}

function linearize(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function luminance(color: Color): number {
  return 0.2126 * linearize(color.r) + 0.7152 * linearize(color.g) + 0.0722 * linearize(color.b);
}

export function contrastRatio(first: Color, second: Color): number {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function ratings(ratio: number): Ratings {
  return {
    aa: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaa: ratio >= 7,
  };
}

export function formatRatio(ratio: number): string {
  return `${(Math.floor(ratio * 100 + 0.5) / 100).toFixed(2)}:1`;
}
