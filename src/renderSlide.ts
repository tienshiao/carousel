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

export function drawText(ctx: CanvasRenderingContext2D, t: TextConfig, cw: number, ch: number) {
  const boxX = (t.x / 100) * cw;
  const boxY = (t.y / 100) * ch;
  const boxW = ((t.width ?? 80) / 100) * cw;
  const fontSize = t.fontSize;
  const padX = fontSize * 0.3;
  const padY = fontSize * 0.1;
  const lineHeight = fontSize * 1.5;

  ctx.font = `${fontSize}px "${t.font}", sans-serif`;
  ctx.textBaseline = "top";

  const halfLeading = (lineHeight - fontSize) / 2;
  const lines = wrapText(ctx, t.text, boxW - padX * 2);
  const textH = lines.length * lineHeight;

  const opacity = t.backgroundOpacity ?? 0.5;
  const rgb = hexToRgb(t.backgroundColor);
  if (rgb && opacity > 0) {
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, textH + padY * 2, 4);
    ctx.fill();
  }

  ctx.fillStyle = t.color;
  for (let i = 0; i < lines.length; i++) {
    const lineW = ctx.measureText(lines[i]!).width;
    let lx = boxX + padX;
    if (t.alignment === "center") lx = boxX + (boxW - lineW) / 2;
    else if (t.alignment === "right") lx = boxX + boxW - padX - lineW;
    ctx.fillText(lines[i]!, lx, boxY + padY + halfLeading + i * lineHeight);
  }
}

export interface TextBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function getTextBoxes(
  ctx: CanvasRenderingContext2D,
  texts: TextConfig[],
  cw: number,
  ch: number,
): TextBox[] {
  return texts.map((t) => {
    const boxX = (t.x / 100) * cw;
    const boxY = (t.y / 100) * ch;
    const boxW = ((t.width ?? 80) / 100) * cw;
    const fontSize = t.fontSize;
    const padY = fontSize * 0.1;
    const lineHeight = fontSize * 1.5;

    ctx.font = `${fontSize}px "${t.font}", sans-serif`;
    const padX = fontSize * 0.3;
    const lines = wrapText(ctx, t.text, boxW - padX * 2);
    const textH = lines.length * lineHeight;

    return { id: t.id, x: boxX, y: boxY, w: boxW, h: textH + padY * 2 };
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
