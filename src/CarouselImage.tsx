import { useEffect, useRef, useState, useCallback } from "react";
import type { Dimensions, ImageConfig } from "./types";
import { loadImage, renderSlideToCanvas, getTextBoxes } from "./renderSlide";

export function CarouselImage({
  config,
  dimensions,
  onTextMove,
}: {
  config: ImageConfig;
  dimensions: Dimensions;
  onTextMove?: (textId: string, x: number, y: number) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{
    textId: string;
    startPointerX: number;
    startPointerY: number;
    startTextX: number;
    startTextY: number;
  } | null>(null);
  const [, setRedrawTick] = useState(0);

  // ResizeObserver for scaling
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0]!.contentRect;
      setScale(Math.min(width / dimensions.width, 1));
    });
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [dimensions.width]);

  // Load image when config.image changes
  useEffect(() => {
    if (!config.image) {
      imageRef.current = null;
      setRedrawTick((t) => t + 1);
      return;
    }
    let cancelled = false;
    loadImage(config.image).then((img) => {
      if (!cancelled) {
        imageRef.current = img;
        setRedrawTick((t) => t + 1);
      }
    });
    return () => { cancelled = true; };
  }, [config.image]);

  // Canvas redraw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderSlideToCanvas(ctx, config, dimensions, imageRef.current);
  });

  // Hit-test helper
  const hitTest = useCallback(
    (canvasX: number, canvasY: number): { textId: string; textX: number; textY: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      const boxes = getTextBoxes(ctx, config.texts, dimensions.width, dimensions.height);
      // Reverse order so topmost (last rendered) is tested first
      for (let i = boxes.length - 1; i >= 0; i--) {
        const b = boxes[i]!;
        if (canvasX >= b.x && canvasX <= b.x + b.w && canvasY >= b.y && canvasY <= b.y + b.h) {
          const t = config.texts[i]!;
          return { textId: b.id, textX: t.x, textY: t.y };
        }
      }
      return null;
    },
    [config.texts, dimensions.width, dimensions.height],
  );

  // Convert pointer event to canvas coordinates
  const toCanvasCoords = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale,
      };
    },
    [scale],
  );

  function handlePointerDown(e: React.PointerEvent) {
    if (!onTextMove) return;
    const { x, y } = toCanvasCoords(e);
    const hit = hitTest(x, y);
    if (!hit) return;
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    dragRef.current = {
      textId: hit.textId,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startTextX: hit.textX,
      startTextY: hit.textY,
    };
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (drag && onTextMove) {
      // Dragging
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dx = ((e.clientX - drag.startPointerX) / rect.width) * 100;
      const dy = ((e.clientY - drag.startPointerY) / rect.height) * 100;
      const nx = Math.min(100, drag.startTextX + dx);
      const ny = Math.max(0, Math.min(100, drag.startTextY + dy));
      onTextMove(drag.textId, nx, ny);
    } else if (onTextMove) {
      // Hover cursor
      const { x, y } = toCanvasCoords(e);
      const hit = hitTest(x, y);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = hit ? "grab" : "default";
      }
    }
  }

  function handlePointerUp() {
    if (dragRef.current && canvasRef.current) {
      canvasRef.current.style.cursor = "default";
    }
    dragRef.current = null;
  }

  return (
    <div ref={wrapperRef} className="carousel-preview-wrapper">
      <div
        className="carousel-preview-sizer"
        style={{
          width: dimensions.width * scale,
          height: dimensions.height * scale,
        }}
      >
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            display: "block",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
    </div>
  );
}
