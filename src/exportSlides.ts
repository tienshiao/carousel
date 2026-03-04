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
) {
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  let dx = 0, dy = 0, dw = cw, dh = ch;

  // Convert 0-100 percentage to 0-1 factor
  const fx = imageX / 100;
  const fy = imageY / 100;

  if (fit === "fill") {
    // stretch to fill — position doesn't apply
  } else if (fit === "none") {
    // draw at natural size, positioned by percentage
    dw = sw;
    dh = sh;
    dx = (cw - dw) * fx;
    dy = (ch - dh) * fy;
  } else if (fit === "cover") {
    const scale = Math.max(cw / sw, ch / sh);
    const scaledW = sw * scale;
    const scaledH = sh * scale;
    dx = (cw - scaledW) * fx;
    dy = (ch - scaledH) * fy;
    dw = scaledW;
    dh = scaledH;
  } else if (fit === "contain") {
    const scale = Math.min(cw / sw, ch / sh);
    const scaledW = sw * scale;
    const scaledH = sh * scale;
    dx = (cw - scaledW) * fx;
    dy = (ch - scaledH) * fy;
    dw = scaledW;
    dh = scaledH;
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function drawText(ctx: CanvasRenderingContext2D, t: TextConfig, cw: number, ch: number) {
  const x = (t.x / 100) * cw;
  const y = (t.y / 100) * ch;
  const fontSize = t.fontSize;
  ctx.font = `${fontSize}px "${t.font}", sans-serif`;
  ctx.textBaseline = "top";

  const metrics = ctx.measureText(t.text);
  const textW = metrics.width;
  const textH = fontSize * 1.3; // approximate line height
  const padX = fontSize * 0.3;
  const padY = fontSize * 0.1;

  let textX = x;
  if (t.alignment === "center") textX = x - textW / 2;
  else if (t.alignment === "right") textX = x - textW;

  // Draw background box
  const opacity = t.backgroundOpacity ?? 0.5;
  const rgb = hexToRgb(t.backgroundColor);
  if (rgb && opacity > 0) {
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    const boxX = textX - padX;
    const boxY = y - padY;
    const boxW = textW + padX * 2;
    const boxH = textH + padY * 2;
    const r = 4;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, r);
    ctx.fill();
  }

  // Draw text
  ctx.fillStyle = t.color;
  ctx.fillText(t.text, textX, y);
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
    drawImageWithFit(ctx, img, cw, ch, slide.imageFit, slide.imageX, slide.imageY);
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
