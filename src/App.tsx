import { useState } from "react";
import { CarouselImage } from "./CarouselImage";
import { CarouselImageConfig } from "./CarouselImageConfig";
import { GlobalConfig } from "./GlobalConfig";
import type { Dimensions, ImageConfig } from "./types";
import "./index.css";
import "./carousel.css";

const defaultDimensions: Dimensions = {
  width: 1080,
  height: 1920,
};

function makeSlide(): ImageConfig {
  return {
    id: crypto.randomUUID(),
    image: null,
    imageFit: "cover",
    imageX: 50,
    imageY: 50,
    imageBlur: 0,
    backgroundColor: "#1a1a2e",
    texts: [],
  };
}

export function App() {
  const [dimensions, setDimensions] = useState<Dimensions>(defaultDimensions);
  const [slides, setSlides] = useState<ImageConfig[]>([makeSlide()]);

  function updateSlide(id: string, updated: ImageConfig) {
    setSlides((s) => s.map((slide) => (slide.id === id ? updated : slide)));
  }

  function removeSlide(id: string) {
    setSlides((s) => s.filter((slide) => slide.id !== id));
  }

  return (
    <div className="carousel-outer">
      <GlobalConfig dimensions={dimensions} onDimensionsChange={setDimensions} slides={slides} />
      {slides.map((slide, i) => (
        <div key={slide.id} className="carousel-slide">
          <div className="carousel-slide-header">
            <span className="slide-label">Slide {i + 1}</span>
            {slides.length > 1 && (
              <button className="danger" onClick={() => removeSlide(slide.id)}>
                Remove
              </button>
            )}
          </div>
          <div className="carousel-app">
            <CarouselImageConfig
              config={slide}
              onChange={(updated) => updateSlide(slide.id, updated)}
            />
            <CarouselImage config={slide} dimensions={dimensions} />
          </div>
        </div>
      ))}
      <button
        className="add-slide-button"
        onClick={() => setSlides((s) => [...s, makeSlide()])}
      >
        + Add Slide
      </button>
    </div>
  );
}

export default App;
