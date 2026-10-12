import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import App from "../src/App";

describe("default application rendering", () => {
  test("renders the default contrast matrix with ratios and pass states", () => {
    const html = renderToString(<App />);

    expect(html).toContain("4.54:1");
    expect(html).toContain('data-pass="true"');
    expect(html).toContain('data-pass="false"');
    expect(html).toContain("matrix-scroll");
  });

  test("renders the default pair summary between the heading and matrix", () => {
    const html = renderToString(<App />);
    const summary =
      '<p class="pair-summary" data-testid="pair-summary">6 pairs: 3 pass AA, 2 pass AA large only, 1 fail</p>';

    expect(html).toContain(summary);
    expect(html.indexOf('class="matrix-heading"')).toBeLessThan(html.indexOf(summary));
    expect(html.indexOf(summary)).toBeLessThan(html.indexOf('class="matrix-scroll"'));
  });

  test("omits the pair summary for a one-color palette", () => {
    const html = renderToString(<App initialInput="white: #ffffff" />);

    expect(html).not.toContain("pair-summary");
    expect(html).toContain('class="matrix-scroll"');
  });

  test("omits the pair summary for an empty palette", () => {
    const html = renderToString(<App initialInput="" />);

    expect(html).not.toContain("pair-summary");
    expect(html).toContain("Your matrix will appear here");
  });
});
