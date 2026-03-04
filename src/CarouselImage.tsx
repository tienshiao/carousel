import type { Dimensions, ImageConfig, TextConfig } from "./types";

function getTransformX(alignment: TextConfig["alignment"]): string {
  switch (alignment) {
    case "left":
      return "translateX(0)";
    case "center":
      return "translateX(-50%)";
    case "right":
      return "translateX(-100%)";
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m || !m[1] || !m[2] || !m[3]) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function bgWithOpacity(color: string, opacity: number): string {
  const rgb = hexToRgb(color);
  if (rgb) return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
  return color;
}

export function CarouselImage({ config, dimensions }: { config: ImageConfig; dimensions: Dimensions }) {
  const aspectRatio = `${dimensions.width} / ${dimensions.height}`;

  return (
    <div className="carousel-preview-wrapper">
      <div
        className="carousel-preview"
        style={{
          aspectRatio,
          backgroundColor: config.backgroundColor,
          backgroundImage: config.image ? `url(${config.image})` : undefined,
          backgroundSize: config.imageFit === "fill" ? "100% 100%" : config.imageFit,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {config.texts.map((t) => (
          <div
            key={t.id}
            style={{
              position: "absolute",
              left: `${t.x}%`,
              top: `${t.y}%`,
              transform: getTransformX(t.alignment),
              color: t.color,
              fontFamily: t.font,
              fontSize: `${t.fontSize}px`,
              backgroundColor: bgWithOpacity(t.backgroundColor, t.backgroundOpacity ?? 0.5),
              borderRadius: "4px",
              padding: "0.1em 0.3em",
              whiteSpace: "pre-wrap",
              maxWidth: "100%",
              boxSizing: "border-box",
            }}
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
