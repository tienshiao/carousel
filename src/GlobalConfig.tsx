import { useRef } from "react";
import type { Dimensions, ImageConfig } from "./types";
import { exportSlides } from "./exportSlides";

const PRESETS = [
  { label: "TikTok", width: 1080, height: 1920 },
  { label: "IG Square", width: 1080, height: 1080 },
  { label: "IG Story", width: 1080, height: 1920 },
  { label: "YouTube", width: 1920, height: 1080 },
];

function saveProject(dimensions: Dimensions, slides: ImageConfig[]) {
  const json = JSON.stringify({ dimensions, slides }, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "carousel-project.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function GlobalConfig({
  dimensions,
  onDimensionsChange,
  slides,
  onImport,
}: {
  dimensions: Dimensions;
  onDimensionsChange: (d: Dimensions) => void;
  slides: ImageConfig[];
  onImport: (data: { dimensions: Dimensions; slides: ImageConfig[] }) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!data.dimensions || !data.slides) {
          alert("Invalid project file: missing dimensions or slides.");
          return;
        }
        onImport(data);
      } catch {
        alert("Failed to parse project file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

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
      <button className="export-button" onClick={() => saveProject(dimensions, slides)}>
        Save Project
      </button>
      <button className="export-button" onClick={() => fileInputRef.current?.click()}>
        Load Project
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}
