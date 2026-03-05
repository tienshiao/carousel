import type { Dimensions, ImageConfig, ImageFit, TextConfig } from "./types";

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m || !m[1] || !m[2] || !m[3]) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function drawImageWithFit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cw: number,
  ch: number,
  fit: ImageFit,
  imageX: number = 50,
  imageY: number = 50,
  imageZoom: number = 100,
) {
  const sw = img.naturalWidth, sh = img.naturalHeight;
  const zoom = imageZoom / 100;
  const fx = imageX / 100;
  const fy = imageY / 100;

  let dw = cw, dh = ch;
  if (fit === "fill") {
    dw = cw;
    dh = ch;
  } else if (fit === "none") {
    dw = sw;
    dh = sh;
  } else if (fit === "cover") {
    const scale = Math.max(cw / sw, ch / sh);
    dw = sw * scale;
    dh = sh * scale;
  } else if (fit === "contain") {
    const scale = Math.min(cw / sw, ch / sh);
    dw = sw * scale;
    dh = sh * scale;
  }

  const dx = (cw - dw) * fx;
  const dy = (ch - dh) * fy;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (zoom !== 1) {
    ctx.save();
    ctx.translate(cw / 2, ch / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-cw / 2, -ch / 2);
    ctx.drawImage(img, 0, 0, sw, sh, dx, dy, dw, dh);
    ctx.restore();
  } else {
    ctx.drawImage(img, 0, 0, sw, sh, dx, dy, dw, dh);
  }
}

export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

interface MeasuredTextBox {
  boxX: number;
  boxY: number;
  boxW: number;
  boxH: number;
  lines: string[];
  padX: number;
  padY: number;
  lineHeight: number;
  halfLeading: number;
}

function measureTextBox(ctx: CanvasRenderingContext2D, t: TextConfig, cw: number, ch: number): MeasuredTextBox {
  const boxX = (t.x / 100) * cw;
  const boxY = (t.y / 100) * ch;
  const boxW = (t.width / 100) * cw;
  const fontSize = t.fontSize;
  const padX = fontSize * 0.3;
  const padY = fontSize * 0.1;
  const lineHeight = fontSize * 1.5;

  ctx.font = `${fontSize}px "${t.font}", sans-serif`;
  const lines = wrapText(ctx, t.text, boxW - padX * 2);
  const boxH = lines.length * lineHeight + padY * 2;
  const halfLeading = (lineHeight - fontSize) / 2;

  return { boxX, boxY, boxW, boxH, lines, padX, padY, lineHeight, halfLeading };
}

export function drawText(ctx: CanvasRenderingContext2D, t: TextConfig, cw: number, ch: number) {
  const m = measureTextBox(ctx, t, cw, ch);
  ctx.save();
  ctx.textBaseline = "top";

  // Rotate around the center of the text box
  if (t.rotation) {
    const cx = m.boxX + m.boxW / 2;
    const cy = m.boxY + m.boxH / 2;
    ctx.translate(cx, cy);
    ctx.rotate((t.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  const rgb = hexToRgb(t.backgroundColor);
  if (rgb && t.backgroundOpacity > 0) {
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${t.backgroundOpacity})`;
    ctx.beginPath();
    ctx.roundRect(m.boxX, m.boxY, m.boxW, m.boxH, 4);
    ctx.fill();
  }

  ctx.fillStyle = t.color;
  for (let i = 0; i < m.lines.length; i++) {
    const lineW = ctx.measureText(m.lines[i]!).width;
    let lx = m.boxX + m.padX;
    if (t.alignment === "center") lx = m.boxX + (m.boxW - lineW) / 2;
    else if (t.alignment === "right") lx = m.boxX + m.boxW - m.padX - lineW;
    ctx.fillText(m.lines[i]!, lx, m.boxY + m.padY + m.halfLeading + i * m.lineHeight);
  }
  ctx.restore();
}

export interface TextBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
}

export function getTextBoxes(
  ctx: CanvasRenderingContext2D,
  texts: TextConfig[],
  cw: number,
  ch: number,
): TextBox[] {
  return texts.map((t) => {
    const m = measureTextBox(ctx, t, cw, ch);
    return { id: t.id, x: m.boxX, y: m.boxY, w: m.boxW, h: m.boxH, rotation: t.rotation };
  });
}

export function renderSlideToCanvas(
  ctx: CanvasRenderingContext2D,
  slide: ImageConfig,
  dimensions: Dimensions,
  loadedImage?: HTMLImageElement | null,
) {
  const { width: cw, height: ch } = dimensions;

  // Background color
  ctx.fillStyle = slide.backgroundColor;
  ctx.fillRect(0, 0, cw, ch);

  // Background image
  if (loadedImage) {
    if (slide.imageBlur > 0) {
      ctx.filter = `blur(${slide.imageBlur}px)`;
    }
    drawImageWithFit(ctx, loadedImage, cw, ch, slide.imageFit, slide.imageX, slide.imageY, slide.imageZoom);
    ctx.filter = "none";
  }

  // Text overlays
  for (const t of slide.texts) {
    drawText(ctx, t, cw, ch);
  }
}
