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
});
