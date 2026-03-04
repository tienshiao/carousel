import type { Dimensions, ImageConfig } from "./types";
import { loadImage, renderSlideToCanvas } from "./renderSlide";

async function renderSlide(
  slide: ImageConfig,
  dimensions: Dimensions,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const ctx = canvas.getContext("2d")!;

  const img = slide.image ? await loadImage(slide.image) : null;
  renderSlideToCanvas(ctx, slide, dimensions, img);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/png");
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportSlides(slides: ImageConfig[], dimensions: Dimensions, projectName?: string) {
  const prefix = projectName?.trim() || "slide";
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]!;
    const blob = await renderSlide(slide, dimensions);
    downloadBlob(blob, `${prefix}-${i + 1}.png`);
  }
}
