import type { Dimensions, ImageConfig } from "./types";
import { exportSlides } from "./exportSlides";

const PRESETS = [
  { label: "TikTok", width: 1080, height: 1920 },
  { label: "IG Square", width: 1080, height: 1080 },
  { label: "IG Story", width: 1080, height: 1920 },
  { label: "YouTube", width: 1920, height: 1080 },
];

export function GlobalConfig({
  dimensions,
  onDimensionsChange,
  slides,
}: {
  dimensions: Dimensions;
  onDimensionsChange: (d: Dimensions) => void;
  slides: ImageConfig[];
}) {
  return (
    <div className="carousel-config global-config">
      <section>
        <h2>Dimensions</h2>
        <div className="config-row">
          <label>
            W
            <input
              type="number"
              value={dimensions.width}
              min={1}
              onChange={(e) =>
                onDimensionsChange({ ...dimensions, width: Number(e.target.value) || 1 })
              }
              style={{ width: "5em" }}
            />
          </label>
          <span>×</span>
          <label>
            H
            <input
              type="number"
              value={dimensions.height}
              min={1}
              onChange={(e) =>
                onDimensionsChange({ ...dimensions, height: Number(e.target.value) || 1 })
              }
              style={{ width: "5em" }}
            />
          </label>
        </div>
        <div className="preset-buttons">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => onDimensionsChange({ width: p.width, height: p.height })}
            >
              {p.label} ({p.width}×{p.height})
            </button>
          ))}
        </div>
      </section>
      <button
        className="export-button"
        onClick={() => exportSlides(slides, dimensions)}
      >
        Export All as PNG
      </button>
    </div>
  );
}
