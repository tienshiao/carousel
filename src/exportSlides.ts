import type { Dimensions, ImageConfig, ImageFit, TextConfig } from "./types";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m || !m[1] || !m[2] || !m[3]) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawImageWithFit(
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

  // Compute base image size (no zoom) — matches CSS backgroundSize
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

  // Position within container — matches CSS backgroundPosition percentage
  const dx = (cw - dw) * fx;
  const dy = (ch - dh) * fy;

  // Apply zoom as uniform scale from center — matches CSS transform: scale(zoom)
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

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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

function drawText(ctx: CanvasRenderingContext2D, t: TextConfig, cw: number, ch: number) {
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

  // Draw background box
  const opacity = t.backgroundOpacity ?? 0.5;
  const rgb = hexToRgb(t.backgroundColor);
  if (rgb && opacity > 0) {
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, textH + padY * 2, 4);
    ctx.fill();
  }

  // Draw text lines — offset by half-leading to match CSS line-height centering
  ctx.fillStyle = t.color;
  for (let i = 0; i < lines.length; i++) {
    const lineW = ctx.measureText(lines[i]!).width;
    let lx = boxX + padX;
    if (t.alignment === "center") lx = boxX + (boxW - lineW) / 2;
    else if (t.alignment === "right") lx = boxX + boxW - padX - lineW;
    ctx.fillText(lines[i]!, lx, boxY + padY + halfLeading + i * lineHeight);
  }
}

async function renderSlide(
  slide: ImageConfig,
  dimensions: Dimensions,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const ctx = canvas.getContext("2d")!;
  const { width: cw, height: ch } = dimensions;

  // Background color
  ctx.fillStyle = slide.backgroundColor;
  ctx.fillRect(0, 0, cw, ch);

  // Background image
  if (slide.image) {
    const img = await loadImage(slide.image);
    if (slide.imageBlur > 0) {
      ctx.filter = `blur(${slide.imageBlur}px)`;
    }
    drawImageWithFit(ctx, img, cw, ch, slide.imageFit, slide.imageX, slide.imageY, slide.imageZoom);
    ctx.filter = "none";
  }

  // Text overlays
  for (const t of slide.texts) {
    drawText(ctx, t, cw, ch);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/png");
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportSlides(slides: ImageConfig[], dimensions: Dimensions) {
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]!;
    const blob = await renderSlide(slide, dimensions);
    downloadBlob(blob, `slide-${i + 1}.png`);
  }
}
