import { toHex } from "./color";
import type { NamedColor } from "./grid";

export function toCssVariables(colors: NamedColor[]): string {
  return colors
    .map(({ name, color }) => {
      const variableName = name
        .toLowerCase()
        .replace(/^#/, "")
        .replace(/[^a-z0-9-]+/g, "-");
      return `--color-${variableName}: ${toHex(color)};`;
    })
    .join("\n");
}
