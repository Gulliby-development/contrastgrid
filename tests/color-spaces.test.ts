import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseColor, toHex } from "../src/color";
import { parseInput } from "../src/grid";

const readmePath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "README.md");

describe("space-separated CSS colors", () => {
  test("parses the requested RGB and HSL examples", () => {
    const examples: [string, string][] = [
      ["rgb(17 24 39)", "#111827"],
      ["RGB( 1   2 3 )", "#010203"],
      ["rgb(255 255 255)", "#ffffff"],
      ["hsl(210 50% 40%)", "#336699"],
      ["HSL(360 100% 50%)", "#ff0000"],
      ["hsl( 0   100%   95% )", "#ffe6e6"],
      ["hsl(0 0% 0%)", "#000000"],
      ["rgb(\t1\t2\t3\t)", "#010203"],
    ];

    for (const [input, expectedHex] of examples) {
      const color = parseColor(input);
      expect(color ? toHex(color) : undefined).toBe(expectedHex);
    }
  });

  test("matches comma-separated colors with the same values", () => {
    const examples: [string, string][] = [
      ["rgb(17 24 39)", "rgb(17, 24, 39)"],
      ["RGB( 1   2 3 )", "RGB(1, 2, 3)"],
      ["rgb(255 255 255)", "rgb(255, 255, 255)"],
      ["hsl(210 50% 40%)", "hsl(210, 50%, 40%)"],
      ["HSL(360 100% 50%)", "HSL(360, 100%, 50%)"],
      ["hsl( 0   100%   95% )", "hsl(0, 100%, 95%)"],
      ["hsl(0 0% 0%)", "hsl(0, 0%, 0%)"],
    ];

    for (const [spaceForm, commaForm] of examples) {
      expect(parseColor(spaceForm)).toEqual(parseColor(commaForm));
    }
  });

  test("rejects mixed separators and malformed space-separated colors", () => {
    const rejected = [
      "rgb(1, 2 3)",
      "rgb(1 2, 3)",
      "rgb(1 2 3 / 50%)",
      "rgb(1 2)",
      "rgb(1 2 3 4)",
      "rgb(1 2 256)",
      "rgb(1 2 3.5)",
      "rgba(1 2 3)",
      "hsl(0, 0% 0%)",
      "hsl(0 0%, 0%)",
      "hsl(0 0 0)",
      "hsl(0 0 % 0%)",
      "hsl(361 0% 0%)",
      "hsl(0 101% 0%)",
      "hsl(0deg 0% 0%)",
      "hsl(0 0% 0% / 1)",
    ];

    for (const input of rejected) {
      expect(parseColor(input)).toBeUndefined();
    }
  });

  test("parses the specified multi-line Colors input", () => {
    const result = parseInput(
      "ink: rgb(17 24 39)\nsky: hsl(210 50% 40%)\nbad: rgb(1, 2 3)\nhsl(0 100% 50%)",
    );

    expect(result.colors).toEqual([
      { name: "ink", color: { r: 17, g: 24, b: 39 }, hex: "#111827" },
      { name: "sky", color: { r: 51, g: 102, b: 153 }, hex: "#336699" },
      { name: "#ff0000", color: { r: 255, g: 0, b: 0 }, hex: "#ff0000" },
    ]);
    expect(result.errors).toEqual(['Line 3: unrecognized color "rgb(1, 2 3)"']);
  });

  test("documents the supported space-separated forms in the README", () => {
    const readme = readFileSync(readmePath, "utf8");

    expect(readme).toContain(
      "`rgb` and `hsl` also accept the space-separated form `rgb(17 24 39)` and `hsl(210 50% 40%)` (at least one space between the numbers, none needed around the parentheses), but commas and spaces cannot be mixed in one color; `hsla()`, a `/` alpha part, decimals and units such as `deg` are not recognized.",
    );
  });
});
