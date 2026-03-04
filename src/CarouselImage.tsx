import { useRef, useState } from "react";
import type { Dimensions, ImageConfig } from "./types";


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

export function CarouselImage({
  config,
  dimensions,
  onTextMove,
}: {
  config: ImageConfig;
  dimensions: Dimensions;
  onTextMove?: (textId: string, x: number, y: number) => void;
}) {
  const aspectRatio = `${dimensions.width} / ${dimensions.height}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    textId: string;
    startPointerX: number;
    startPointerY: number;
    startTextX: number;
    startTextY: number;
  } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function handlePointerDown(e: React.PointerEvent, textId: string, textX: number, textY: number) {
    if (!onTextMove) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingId(textId);
    dragRef.current = {
      textId,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startTextX: textX,
      startTextY: textY,
    };
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || !containerRef.current || !onTextMove) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - drag.startPointerX) / rect.width) * 100;
    const dy = ((e.clientY - drag.startPointerY) / rect.height) * 100;
    const x = Math.max(0, Math.min(100, drag.startTextX + dx));
    const y = Math.max(0, Math.min(100, drag.startTextY + dy));
    onTextMove(drag.textId, x, y);
  }

  function handlePointerUp() {
    dragRef.current = null;
    setDraggingId(null);
  }

  return (
    <div className="carousel-preview-wrapper">
      <div
        ref={containerRef}
        className="carousel-preview"
        style={{
          aspectRatio,
          backgroundColor: config.backgroundColor,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {config.image && (() => {
          const zoom = (config.imageZoom ?? 100) / 100;
          const blurPad = config.imageBlur > 0 ? config.imageBlur * 2 : 0;
          const extraPad = zoom > 1 ? `${((zoom - 1) / 2) * 100}%` : "0px";
          return (
            <div
              style={{
                position: "absolute",
                inset: `calc(-${blurPad}px - ${extraPad})`,
                backgroundImage: `url(${config.image})`,
                backgroundSize: config.imageFit === "fill" ? "100% 100%" : config.imageFit,
                backgroundPosition: `${config.imageX}% ${config.imageY}%`,
                backgroundRepeat: "no-repeat",
                transform: zoom !== 1 ? `scale(${zoom})` : undefined,
                filter: config.imageBlur > 0 ? `blur(${config.imageBlur}px)` : undefined,
              }}
            />
          );
        })()}
        {config.texts.map((t) => (
          <div
            key={t.id}
            onPointerDown={(e) => handlePointerDown(e, t.id, t.x, t.y)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
              position: "absolute",
              left: `${t.x}%`,
              top: `${t.y}%`,
              width: `${t.width ?? 80}%`,
              color: t.color,
              fontFamily: t.font,
              fontSize: `${t.fontSize}px`,
              textAlign: t.alignment,
              backgroundColor: bgWithOpacity(t.backgroundColor, t.backgroundOpacity ?? 0.5),
              borderRadius: "4px",
              padding: "0.1em 0.3em",
              whiteSpace: "pre-wrap",
              boxSizing: "border-box",
              cursor: onTextMove ? (draggingId === t.id ? "grabbing" : "grab") : undefined,
              userSelect: draggingId ? "none" : undefined,
            }}
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
