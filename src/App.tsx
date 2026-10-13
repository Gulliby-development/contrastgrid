import { useMemo, useState } from "react";
import { formatRatio } from "./contrast";
import { toCssVariables } from "./css";
import { buildGrid, formatPairSummary, parseInput, summarizePairs } from "./grid";

const DEFAULT_COLORS = `white: #ffffff
ink: #111827
brand: #2563eb
gray: #767676`;

export default function App({ initialInput = DEFAULT_COLORS }: { initialInput?: string } = {}) {
  const [input, setInput] = useState(initialInput);
  const [copied, setCopied] = useState(false);
  const { colors, errors } = useMemo(() => parseInput(input), [input]);
  const grid = useMemo(() => buildGrid(colors), [colors]);
  const pairSummary = useMemo(() => summarizePairs(colors), [colors]);

  async function copyCssVariables() {
    await navigator.clipboard.writeText(toCssVariables(colors));
    setCopied(true);
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Contrastgrid home">
          <span className="brand-mark" aria-hidden="true">
            Cg
          </span>
          <span>contrastgrid</span>
        </a>
        <p>Check color contrast, side by side.</p>
      </header>

      <section className="workspace" aria-label="Contrast checker">
        <aside className="input-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Your palette</p>
              <h1>Color inputs</h1>
            </div>
            <span className="color-count">
              {colors.length} {colors.length === 1 ? "color" : "colors"}
            </span>
          </div>
          <label className="field-label" htmlFor="colors">
            Colors
          </label>
          <textarea
            id="colors"
            className="colors-input"
            value={input}
            onChange={(event) => {
              setInput(event.currentTarget.value);
              setCopied(false);
            }}
            spellCheck={false}
            placeholder={"white: #ffffff\nink: #111827"}
            aria-describedby="input-hint"
          />
          <p className="input-hint" id="input-hint">
            One color per line. Add an optional name before a colon. Formats: #rgb, #rrggbb, rgb(r,
            g, b) and hsl(h, s%, l%).
          </p>
          {errors.length > 0 && (
            <ul className="input-errors" aria-label="Input errors">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
        </aside>

        <section className="matrix-panel" aria-label="Contrast matrix">
          <div className="matrix-heading">
            <div>
              <p className="eyebrow">Accessibility overview</p>
              <h2>Contrast matrix</h2>
            </div>
            <button
              className="copy-button"
              type="button"
              disabled={colors.length === 0}
              onClick={copyCssVariables}
            >
              <span aria-hidden="true">{copied ? "✓" : "↗"}</span>
              {copied ? "Copied" : "Copy CSS variables"}
            </button>
          </div>
          {colors.length >= 2 && (
            <p className="pair-summary" data-testid="pair-summary">
              {formatPairSummary(pairSummary)}
            </p>
          )}
          {colors.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">
                Aa
              </span>
              <h3>Your matrix will appear here</h3>
              <p>Add a valid color to start comparing text and backgrounds.</p>
            </div>
          ) : (
            <>
              <div className="matrix-scroll">
                <table className="contrast-table">
                  <thead>
                    <tr>
                      <th className="corner-cell" scope="col">
                        <span>Text ↓</span>
                        <span>Background →</span>
                      </th>
                      {colors.map((color) => (
                        <th scope="col" key={color.name}>
                          <span className="column-color">
                            <span
                              className="color-dot"
                              style={{ backgroundColor: color.hex }}
                              aria-hidden="true"
                            />
                            {color.name}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grid.map((row, rowIndex) => (
                      <tr key={colors[rowIndex].name}>
                        <th className="row-heading" scope="row">
                          <span className="column-color">
                            <span
                              className="color-dot"
                              style={{ backgroundColor: colors[rowIndex].hex }}
                              aria-hidden="true"
                            />
                            {colors[rowIndex].name}
                          </span>
                        </th>
                        {row.map((cell) => (
                          <td
                            key={`${cell.textColor.name}-${cell.backgroundColor.name}`}
                            className={cell.diagonal ? "diagonal-cell" : ""}
                          >
                            {cell.diagonal ? (
                              <span className="diagonal-mark">-</span>
                            ) : (
                              <>
                                <div
                                  className="swatch"
                                  style={{
                                    color: cell.textColor.hex,
                                    backgroundColor: cell.backgroundColor.hex,
                                  }}
                                  title={`${cell.textColor.name} text on ${cell.backgroundColor.name} background`}
                                >
                                  Aa
                                </div>
                                <p className="ratio">{formatRatio(cell.ratio ?? 0)}</p>
                                <div className="rating-list">
                                  <Rating label="AA" passes={cell.ratings?.aa ?? false} />
                                  <Rating
                                    label="AA large"
                                    passes={cell.ratings?.aaLarge ?? false}
                                  />
                                  <Rating label="AAA" passes={cell.ratings?.aaa ?? false} />
                                </div>
                              </>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="matrix-legend">
                <span>
                  <i className="legend-dot pass" />
                  Passes
                </span>
                <span>
                  <i className="legend-dot fail" />
                  Does not pass
                </span>
                <span>Ratios use WCAG 2.x contrast thresholds</span>
              </div>
            </>
          )}
        </section>
      </section>
      <footer className="site-footer">
        <span>Designed for clearer, more accessible interfaces.</span>
        <span>WCAG 2.x contrast</span>
      </footer>
    </main>
  );
}

function Rating({ label, passes }: { label: string; passes: boolean }) {
  return (
    <span
      className={passes ? "rating rating-pass" : "rating rating-fail"}
      data-pass={String(passes)}
    >
      <span className="rating-indicator" aria-hidden="true">
        {passes ? "✓" : "×"}
      </span>
      {label} {passes ? "pass" : "fail"}
    </span>
  );
}
