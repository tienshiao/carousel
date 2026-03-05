import type { ImageConfig, ImageFit, TextConfig, TextAlignment } from "./types";


const FONTS = [
  "Inter",
  "Arial",
  "Georgia",
  "Courier New",
  "Times New Roman",
  "Verdana",
];

function makeDefaultText(): TextConfig {
  return {
    id: crypto.randomUUID(),
    text: "New Text",
    color: "#ffffff",
    font: "Inter",
    fontSize: 48,
    backgroundColor: "#000000",
    backgroundOpacity: 0.5,
    width: 80,
    alignment: "center",
    x: 10,
    y: 50,
    rotation: 0,
  };
}

export function CarouselImageConfig({
  config,
  onChange,
}: {
  config: ImageConfig;
  onChange: (config: ImageConfig) => void;
}) {
  function updateText(id: string, updates: Partial<TextConfig>) {
    onChange({
      ...config,
      texts: config.texts.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    });
  }

  function removeText(id: string) {
    onChange({ ...config, texts: config.texts.filter((t) => t.id !== id) });
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ ...config, image: reader.result as string });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="carousel-config">
      {/* Image */}
      <section>
        <h2>Image</h2>
        <div className="config-row">
          <input type="file" accept="image/*" onChange={handleImageUpload} />
        </div>
        {config.image && (
          <>
            <div className="config-row">
              <label>
                Fit
                <select
                  value={config.imageFit}
                  onChange={(e) =>
                    onChange({ ...config, imageFit: e.target.value as ImageFit })
                  }
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="fill">Fill</option>
                  <option value="none">None (original size)</option>
                </select>
              </label>
            </div>
            <div className="config-row">
              <label style={{ flex: 1 }}>
                X Position ({config.imageX}%)
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={config.imageX}
                  onChange={(e) =>
                    onChange({ ...config, imageX: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            <div className="config-row">
              <label style={{ flex: 1 }}>
                Y Position ({config.imageY}%)
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={config.imageY}
                  onChange={(e) =>
                    onChange({ ...config, imageY: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            <div className="config-row">
              <label style={{ flex: 1 }}>
                Zoom ({config.imageZoom}%)
                <input
                  type="range"
                  min={50}
                  max={300}
                  value={config.imageZoom}
                  onChange={(e) =>
                    onChange({ ...config, imageZoom: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            <div className="config-row">
              <label style={{ flex: 1 }}>
                Blur ({config.imageBlur}px)
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={0.5}
                  value={config.imageBlur}
                  onChange={(e) =>
                    onChange({ ...config, imageBlur: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            <div className="config-row">
              <button
                className="danger"
                onClick={() => onChange({ ...config, image: null })}
              >
                Remove image
              </button>
            </div>
          </>
        )}
      </section>

      {/* Background Color */}
      <section>
        <h2>Background Color</h2>
        <div className="config-row">
          <input
            type="color"
            value={config.backgroundColor}
            onChange={(e) =>
              onChange({ ...config, backgroundColor: e.target.value })
            }
          />
          <span>{config.backgroundColor}</span>
        </div>
      </section>

      {/* Text Entries */}
      <section>
        <h2>Text</h2>
        {config.texts.map((t) => (
          <div key={t.id} className="text-card">
            <div className="config-row">
              <input
                type="text"
                value={t.text}
                onChange={(e) => updateText(t.id, { text: e.target.value })}
                style={{ flex: 1 }}
              />
              <button className="danger" onClick={() => removeText(t.id)}>
                ×
              </button>
            </div>

            <div className="config-row">
              <label>
                Color
                <input
                  type="color"
                  value={t.color}
                  onChange={(e) => updateText(t.id, { color: e.target.value })}
                />
              </label>
              <label>
                BG
                <input
                  type="color"
                  value={t.backgroundColor}
                  onChange={(e) =>
                    updateText(t.id, { backgroundColor: e.target.value })
                  }
                />
              </label>
            </div>

            <div className="config-row">
              <label style={{ flex: 1 }}>
                BG Opacity ({Math.round(t.backgroundOpacity * 100)}%)
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={t.backgroundOpacity}
                  onChange={(e) =>
                    updateText(t.id, { backgroundOpacity: Number(e.target.value) })
                  }
                />
              </label>
            </div>

            <div className="config-row">
              <label>
                Font
                <select
                  value={t.font}
                  onChange={(e) => updateText(t.id, { font: e.target.value })}
                >
                  {FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Size
                <input
                  type="number"
                  value={t.fontSize}
                  min={1}
                  onChange={(e) =>
                    updateText(t.id, { fontSize: Number(e.target.value) || 1 })
                  }
                  style={{ width: "4em" }}
                />
              </label>
            </div>

            <div className="config-row">
              <label>
                Align
                <select
                  value={t.alignment}
                  onChange={(e) =>
                    updateText(t.id, {
                      alignment: e.target.value as TextAlignment,
                    })
                  }
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
            </div>

            <div className="config-row">
              <label style={{ flex: 1 }}>
                Width ({t.width}%)
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={t.width}
                  onChange={(e) =>
                    updateText(t.id, { width: Number(e.target.value) })
                  }
                />
              </label>
            </div>

            <div className="config-row">
              <label style={{ flex: 1 }}>
                X ({Math.round(t.x)}%)
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={t.x}
                  onChange={(e) =>
                    updateText(t.id, { x: Number(e.target.value) })
                  }
                />
              </label>
            </div>

            <div className="config-row">
              <label style={{ flex: 1 }}>
                Y ({t.y}%)
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={t.y}
                  onChange={(e) =>
                    updateText(t.id, { y: Number(e.target.value) })
                  }
                />
              </label>
            </div>

            <div className="config-row">
              <label style={{ flex: 1 }}>
                Rotation ({t.rotation}°)
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={t.rotation}
                  onChange={(e) =>
                    updateText(t.id, { rotation: Number(e.target.value) })
                  }
                />
              </label>
            </div>
          </div>
        ))}
        <button
          onClick={() =>
            onChange({ ...config, texts: [...config.texts, makeDefaultText()] })
          }
        >
          + Add Text
        </button>
      </section>
    </div>
  );
}
