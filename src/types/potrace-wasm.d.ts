declare module 'potrace-wasm' {
  interface PotraceParams {
    turdSize?: number;
    turnPolicy?: number;
    alphaMax?: number;
    optCurve?: boolean;
    optTolerance?: number;
    threshold?: number;
    blackOnWhite?: boolean;
    width?: number;
    height?: number;
  }

  class Potrace {
    static init(): Promise<Potrace>;
    traceSync(data: Uint8Array, params: PotraceParams): string;
  }

  export default Potrace;
} 