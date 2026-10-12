import { type Color, parseColor, toHex } from "./color";
import { contrastRatio, type Ratings, ratings } from "./contrast";

export interface NamedColor {
  name: string;
  color: Color;
  hex: string;
}

export interface ParseInputResult {
  colors: NamedColor[];
  errors: string[];
}

export interface GridCell {
  textColor: NamedColor;
  backgroundColor: NamedColor;
  ratio: number | undefined;
  ratings: Ratings | undefined;
  diagonal: boolean;
}

export function parseInput(text: string): ParseInputResult {
  const colors: NamedColor[] = [];
  const errors: string[] = [];
  const usedNames = new Set<string>();

  text.split(/\r?\n/).forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    const colonIndex = trimmedLine.indexOf(":");
    const hasName = colonIndex !== -1;
    const name = hasName ? trimmedLine.slice(0, colonIndex).trim() : "";
    const colorText = (hasName ? trimmedLine.slice(colonIndex + 1) : trimmedLine).trim();
    const color = parseColor(colorText);

    if (!color || (hasName && !name)) {
      errors.push(`Line ${index + 1}: unrecognized color "${colorText}"`);
      return;
    }

    const displayName = hasName ? name : toHex(color);
    const normalizedName = displayName.toLowerCase();
    if (usedNames.has(normalizedName)) {
      errors.push(`Line ${index + 1}: duplicate name "${displayName}"`);
      return;
    }

    usedNames.add(normalizedName);
    colors.push({ name: displayName, color, hex: toHex(color) });
  });

  return { colors, errors };
}

export function buildGrid(colors: NamedColor[]): GridCell[][] {
  return colors.map((textColor, rowIndex) =>
    colors.map((backgroundColor, columnIndex) => {
      const diagonal = rowIndex === columnIndex;
      if (diagonal) {
        return { textColor, backgroundColor, ratio: undefined, ratings: undefined, diagonal };
      }

      const ratio = contrastRatio(textColor.color, backgroundColor.color);
      return {
        textColor,
        backgroundColor,
        ratio,
        ratings: ratings(ratio),
        diagonal,
      };
    }),
  );
}
