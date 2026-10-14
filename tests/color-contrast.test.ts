import { describe, expect, test } from "bun:test";
import { parseColor, toHex } from "../src/color";
import { contrastRatio, formatRatio, luminance, ratings } from "../src/contrast";
import { toCssVariables } from "../src/css";
import { buildGrid, parseInput } from "../src/grid";

function referenceHslColor(hue: number, saturation: number, lightness: number) {
  const wrappedHue = hue % 360;
  const chromaBase = (100 - Math.abs(2 * lightness - 100)) * saturation;
  const minimum = 30 * (200 * lightness - chromaBase);
  const chroma = chromaBase * 60;
  const secondary = chromaBase * (60 - Math.abs((wrappedHue % 120) - 60));
  const sector = Math.floor(wrappedHue / 60);
  const contributionsBySector: [number, number, number][] = [
    [chroma, secondary, 0],
    [secondary, chroma, 0],
    [0, chroma, secondary],
    [0, secondary, chroma],
    [secondary, 0, chroma],
    [chroma, 0, secondary],
  ];
  const [red, green, blue] = contributionsBySector[sector] ?? [0, 0, 0];
  const roundChannel = (contribution: number) =>
    Math.floor(((minimum + contribution) * 255 * 2 + 600000) / 1200000);

  return {
    r: roundChannel(red),
    g: roundChannel(green),
    b: roundChannel(blue),
  };
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

describe("parseColor", () => {
  test("parses short and long hexadecimal colors case-insensitively", () => {
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor("#FFF")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  test("parses rgb() integer channels with flexible spacing and casing", () => {
    expect(parseColor("rgb(17, 24, 39)")).toEqual({ r: 17, g: 24, b: 39 });
    expect(parseColor("RGB( 1 ,2,3 )")).toEqual({ r: 1, g: 2, b: 3 });
  });

  test("accepts the supported HSL examples", () => {
    const examples: [string, string][] = [
      ["hsl(0,0%,100%)", "#ffffff"],
      ["hsl(0, 0%, 0%)", "#000000"],
      ["hsl(0,100%,50%)", "#ff0000"],
      ["HSL( 120 , 100% , 50% )", "#00ff00"],
      ["hsl(240,100%,50%)", "#0000ff"],
      ["hsl(360,100%,50%)", "#ff0000"],
      ["hsl(221, 83%, 53%)", "#2463eb"],
      ["hsl(210,50%,40%)", "#336699"],
      ["hsl(30,60%,90%)", "#f5e6d6"],
      ["hsl(60,100%,25%)", "#808000"],
      ["hsl(0,0%,46%)", "#757575"],
    ];

    for (const [input, expectedHex] of examples) {
      const color = parseColor(input);
      const actualHex = color ? toHex(color) : "undefined";
      if (actualHex !== expectedHex) {
        throw new Error(`${input}: expected ${expectedHex}, received ${actualHex}`);
      }
    }
  });

  test("rounds exact-half HSL channels up", () => {
    const examples: [string, string][] = [
      ["hsl(0,0%,50%)", "#808080"],
      ["hsl(0,100%,95%)", "#ffe6e6"],
      ["hsl(0,60%,75%)", "#e69999"],
      ["hsl(0,100%,5%)", "#1a0000"],
    ];

    for (const [input, expectedHex] of examples) {
      const color = parseColor(input);
      const actualHex = color ? toHex(color) : "undefined";
      if (actualHex !== expectedHex) {
        throw new Error(`${input}: expected ${expectedHex}, received ${actualHex}`);
      }
    }
  });

  test("rejects malformed HSL values", () => {
    const rejected = [
      "hsl(361,0%,0%)",
      "hsl(0,101%,0%)",
      "hsl(0,0%,101%)",
      "hsl(0,0,0)",
      "hsl(0,0 %,0%)",

      "hsl(1.5,0%,0%)",
      "hsl(-1,0%,0%)",
      "hsl(0deg,0%,0%)",
      "hsl(0,0%)",
      "hsla(0,100%,50%,1)",
    ];

    for (const input of rejected) {
      if (parseColor(input) !== undefined) {
        throw new Error(`Expected ${input} to be rejected`);
      }
    }
  });

  test("reports HSL line names and errors through parseInput", () => {
    const result = parseInput(
      "Sky: hsl(210, 50%, 40%)\nhsl(0,100%,50%)\nbad: hsl(361,0%,0%)\nhsl(0, 100%, 50%)",
    );

    expect(result.colors).toEqual([
      { name: "Sky", color: { r: 51, g: 102, b: 153 }, hex: "#336699" },
      { name: "#ff0000", color: { r: 255, g: 0, b: 0 }, hex: "#ff0000" },
    ]);
    expect(result.errors).toEqual([
      'Line 3: unrecognized color "hsl(361,0%,0%)"',
      'Line 4: duplicate name "#ff0000"',
    ]);
  });

  test("uses converted HSL colors for grid ratings and CSS variables", () => {
    const { colors } = parseInput("sky: hsl(210,50%,40%)\nwhite: #fff");
    const grid = buildGrid(colors);

    expect(colors.map(({ hex }) => hex)).toEqual(["#336699", "#ffffff"]);
    expect(grid[0]?.[1]?.ratio).toBe(
      contrastRatio({ r: 51, g: 102, b: 153 }, { r: 255, g: 255, b: 255 }),
    );
    expect(grid[0]?.[1]?.ratings).toEqual({ aa: true, aaLarge: true, aaa: false });
    expect(toCssVariables(colors)).toBe("--color-sky: #336699;\n--color-white: #ffffff;");
  });

  test("matches exact conversion for seeded samples across the HSL domain", () => {
    const cases: [number, number, number][] = [
      [0, 0, 0],
      [360, 0, 0],
      [0, 100, 0],
      [360, 100, 0],
      [0, 0, 100],
      [360, 0, 100],
      [0, 100, 100],
      [360, 100, 100],
      [1, 1, 1],
      [359, 99, 99],
      [0, 50, 50],
      [360, 50, 50],
    ];
    const random = seededRandom(0x4c534c);

    for (let index = 0; index < 256; index += 1) {
      cases.push([
        Math.floor(random() * 361),
        Math.floor(random() * 101),
        Math.floor(random() * 101),
      ]);
    }

    for (const [hue, saturation, lightness] of cases) {
      const input = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      const actual = parseColor(input);
      const expected = referenceHslColor(hue, saturation, lightness);
      if (
        !actual ||
        actual.r !== expected.r ||
        actual.g !== expected.g ||
        actual.b !== expected.b
      ) {
        throw new Error(
          `${input}: expected ${toHex(expected)}, received ${actual ? toHex(actual) : "undefined"}`,
        );
      }
    }
  });

  test("rejects malformed colors and channels outside the supported range", () => {
    expect(parseColor("#12")).toBeUndefined();
    expect(parseColor("#gggggg")).toBeUndefined();
    expect(parseColor("rgb(256,0,0)")).toBeUndefined();
    expect(parseColor("rgb(1,2)")).toBeUndefined();
    expect(parseColor("")).toBeUndefined();
  });

  test("formats RGB colors as lower-case six-digit hexadecimal", () => {
    expect(toHex({ r: 37, g: 99, b: 235 })).toBe("#2563eb");
  });
});

describe("WCAG contrast calculations", () => {
  const black = { r: 0, g: 0, b: 0 };
  const white = { r: 255, g: 255, b: 255 };
  const gray = { r: 118, g: 118, b: 118 };
  const nearGray = { r: 119, g: 119, b: 119 };
  const brand = { r: 37, g: 99, b: 235 };
  const ink = { r: 17, g: 24, b: 39 };

  test("calculates relative luminance and reference contrast ratios", () => {
    expect(luminance(black)).toBe(0);
    expect(luminance(white)).toBe(1);
    expect(formatRatio(contrastRatio(black, white))).toBe("21.00:1");
    expect(formatRatio(contrastRatio(gray, white))).toBe("4.54:1");
    expect(formatRatio(contrastRatio(nearGray, white))).toBe("4.48:1");
    expect(formatRatio(contrastRatio(brand, white))).toBe("5.17:1");
    expect(formatRatio(contrastRatio(ink, white))).toBe("17.74:1");
  });

  test("rates exact unrounded thresholds and rounds display values half up", () => {
    expect(ratings(4.5)).toEqual({ aa: true, aaLarge: true, aaa: false });
    expect(ratings(4.499)).toEqual({ aa: false, aaLarge: true, aaa: false });
    expect(formatRatio(4.499)).toBe("4.50:1");
    expect(ratings(3)).toEqual({ aa: false, aaLarge: true, aaa: false });
    expect(ratings(6.999)).toEqual({ aa: true, aaLarge: true, aaa: false });
    expect(ratings(7)).toEqual({ aa: true, aaLarge: true, aaa: true });
  });
});
