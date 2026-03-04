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
  alignment: TextAlignment;
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface ImageConfig {
  id: string;
  image: string | null;
  imageFit: ImageFit;
  backgroundColor: string;
  texts: TextConfig[];
}
