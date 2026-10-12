import { describe, expect, test } from "bun:test";
import { parseColor, toHex } from "../src/color";
import { contrastRatio, formatRatio, luminance, ratings } from "../src/contrast";

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
