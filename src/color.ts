export interface Color {
  r: number;
  g: number;
  b: number;
}

export function parseColor(text: string): Color | undefined {
  const value = text.trim();

  const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(value);
  if (hex) {
    const digits = hex[1];
    const expanded =
      digits.length === 3
        ? digits
            .split("")
            .map((digit) => digit + digit)
            .join("")
        : digits;
    return {
      r: Number.parseInt(expanded.slice(0, 2), 16),
      g: Number.parseInt(expanded.slice(2, 4), 16),
      b: Number.parseInt(expanded.slice(4, 6), 16),
    };
  }

  const rgb =
    /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(value) ??
    /^rgb\s*\(\s*(\d+)[ \t]+(\d+)[ \t]+(\d+)\s*\)$/i.exec(value);
  if (rgb) {
    const channels = rgb.slice(1).map(Number);
    if (channels.some((channel) => channel < 0 || channel > 255)) {
      return undefined;
    }

    return { r: channels[0], g: channels[1], b: channels[2] };
  }

  const hsl =
    /^hsl\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/i.exec(value) ??
    /^hsl\s*\(\s*(\d+)[ \t]+(\d+)%[ \t]+(\d+)%\s*\)$/i.exec(value);
  if (!hsl) return undefined;

  const [hue, saturation, lightness] = hsl.slice(1).map(Number);
  if (hue > 360 || saturation > 100 || lightness > 100) return undefined;

  return hslToRgb(hue, saturation, lightness);
}

function hslToRgb(hue: number, saturation: number, lightness: number): Color {
  const chroma = (100 - Math.abs(2 * lightness - 100)) * saturation;
  const low = 30 * (200 * lightness - chroma);
  const high = 30 * (chroma + 200 * lightness);
  const hueWithinSector = (hue % 120) - 60;
  const middle = chroma * (60 - Math.abs(hueWithinSector)) + low;
  const sector = Math.floor((hue % 360) / 60);

  let numerators: [number, number, number];
  switch (sector) {
    case 0:
      numerators = [high, middle, low];
      break;
    case 1:
      numerators = [middle, high, low];
      break;
    case 2:
      numerators = [low, high, middle];
      break;
    case 3:
      numerators = [low, middle, high];
      break;
    case 4:
      numerators = [middle, low, high];
      break;
    default:
      numerators = [high, low, middle];
      break;
  }

  const channel = (numerator: number) => Math.floor((numerator * 255 * 2 + 600000) / 1200000);
  const [r, g, b] = numerators.map(channel);
  return { r, g, b };
}

export function toHex(color: Color): string {
  const channel = (value: number) =>
    Math.min(255, Math.max(0, Math.trunc(value)))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`;
}
