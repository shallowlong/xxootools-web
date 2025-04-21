declare module 'imagetracerjs' {
  interface ImageTracerOptions {
    ltres?: number;
    qtres?: number;
    pathomit?: number;
    colorsampling?: number;
    numberofcolors?: number;
    mincolorratio?: number;
    colorquantcycles?: number;
    blurradius?: number;
    blurdelta?: number;
    strokewidth?: number;
    linefilter?: boolean;
    scale?: number;
    roundcoords?: number;
    viewbox?: boolean;
    desc?: boolean;
    lcpr?: number;
    qcpr?: number;
  }

  interface ImageTracer {
    imagedataToSVG: (imageData: ImageData, options: ImageTracerOptions) => string;
    imageToSVG: (url: string, options: ImageTracerOptions, callback: (svg: string) => void) => void;
  }

  const ImageTracer: ImageTracer;

  export default ImageTracer;
} 