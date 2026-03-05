export type TextAlignment = "left" | "center" | "right";

export type ImageFit = "cover" | "contain" | "fill" | "none";

export interface TextConfig {
  id: string;
  text: string;
  color: string;
  font: string;
  fontSize: number;
  backgroundColor: string;
  backgroundOpacity: number; // 0-1
  width: number;             // percentage 0-100 of canvas width
  alignment: TextAlignment;
  x: number;
  y: number;
  rotation: number; // degrees, default 0
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface ImageConfig {
  id: string;
  image: string | null;
  imageFit: ImageFit;
  imageX: number;       // 0-100, default 50 (center)
  imageY: number;       // 0-100, default 50 (center)
  imageZoom: number;    // percentage, 100 = normal, default 100
  imageBlur: number;    // 0-20 px, default 0
  backgroundColor: string;
  texts: TextConfig[];
}
