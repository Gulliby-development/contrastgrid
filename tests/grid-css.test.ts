import { describe, expect, test } from "bun:test";
import { toCssVariables } from "../src/css";
import { buildGrid, parseInput } from "../src/grid";

const defaultInput = `white: #ffffff
ink: #111827
brand: #2563eb
gray: #767676`;

describe("parseInput", () => {
  test("parses named and unnamed colors, ignores blanks, and reports exact line errors", () => {
    const result = parseInput(`  Brand Blue: #2563eb

#767676
brand blue: #000000
invalid: #gggggg
  : #fff
ink: #111827`);

    expect(result.colors.map(({ name, hex }) => ({ name, hex }))).toEqual([
      { name: "Brand Blue", hex: "#2563eb" },
      { name: "#767676", hex: "#767676" },
      { name: "ink", hex: "#111827" },
    ]);
    expect(result.errors).toEqual([
      'Line 4: duplicate name "brand blue"',
      'Line 5: unrecognized color "#gggggg"',
      'Line 6: unrecognized color "#fff"',
    ]);
  });

  test("splits a name only at the first colon and trims the parsed parts", () => {
    const result = parseInput("Theme: Accent: #fff");

    expect(result.colors).toHaveLength(0);
    expect(result.errors).toEqual(['Line 1: unrecognized color "Accent: #fff"']);
  });
});

describe("buildGrid", () => {
  test("creates an ordered square grid with diagonal cells marked", () => {
    const { colors, errors } = parseInput(defaultInput);
    const grid = buildGrid(colors);

    expect(errors).toEqual([]);
    expect(grid).toHaveLength(4);
    expect(grid.map((row) => row.length)).toEqual([4, 4, 4, 4]);
    expect(grid.map((row) => row.map((cell) => cell.textColor.name))).toEqual([
      ["white", "white", "white", "white"],
      ["ink", "ink", "ink", "ink"],
      ["brand", "brand", "brand", "brand"],
      ["gray", "gray", "gray", "gray"],
    ]);
    expect(grid[0]?.map((cell) => cell.backgroundColor.name)).toEqual([
      "white",
      "ink",
      "brand",
      "gray",
    ]);
    expect(grid.map((row) => row.map((cell) => cell.diagonal))).toEqual([
      [true, false, false, false],
      [false, true, false, false],
      [false, false, true, false],
      [false, false, false, true],
    ]);
    expect(grid[0]?.[0]).toMatchObject({
      diagonal: true,
      ratio: undefined,
      ratings: undefined,
    });
    expect(grid[1]?.[0]).toMatchObject({
      diagonal: false,
      ratings: { aa: true, aaLarge: true, aaa: true },
    });
    expect(grid[1]?.[0]?.ratio).toBeCloseTo(17.7397, 4);
  });

  test("returns an empty grid for no colors", () => {
    expect(buildGrid([])).toEqual([]);
  });
});

describe("toCssVariables", () => {
  test("formats normalized variable names and preserves input order", () => {
    const { colors, errors } = parseInput(`Brand Blue: #2563eb
#767676
A___B & C: #fff`);

    expect(errors).toEqual([]);
    expect(toCssVariables(colors)).toBe(
      "--color-brand-blue: #2563eb;\n--color-767676: #767676;\n--color-a-b-c: #ffffff;",
    );
  });

  test("returns an empty string without colors", () => {
    expect(toCssVariables([])).toBe("");
  });
});
