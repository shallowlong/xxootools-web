declare module 'squoosh-wasm' {
  // MozJPEG 编码器
  export const enum MozJpegColorSpace {
    GRAYSCALE = 1,
    RGB,
    YCbCr,
  }

  export interface MozJpegEncodeOptions {
    quality: number;
    baseline: boolean;
    arithmetic: boolean;
    progressive: boolean;
    optimize_coding: boolean;
    smoothing: number;
    color_space: MozJpegColorSpace;
    quant_table: number;
    trellis_multipass: boolean;
    trellis_opt_zero: boolean;
    trellis_opt_table: boolean;
    trellis_loops: number;
    auto_subsample: boolean;
    chroma_subsample: number;
    separate_chroma_quality: boolean;
    chroma_quality: number;
  }

  export interface MozJPEGModule extends EmscriptenWasm.Module {
    encode(
      data: BufferSource,
      width: number,
      height: number,
      options: MozJpegEncodeOptions,
    ): Uint8Array;
  }

  // WebP 编码器
  export interface WebPEncodeOptions {
    quality: number;
    target_size: number;
    target_PSNR: number;
    method: number;
    sns_strength: number;
    filter_strength: number;
    filter_sharpness: number;
    filter_type: number;
    partitions: number;
    segments: number;
    pass: number;
    show_compressed: number;
    preprocessing: number;
    autofilter: number;
    partition_limit: number;
    alpha_compression: number;
    alpha_filtering: number;
    alpha_quality: number;
    lossless: number;
    exact: number;
    image_hint: number;
    emulate_jpeg_size: number;
    thread_level: number;
    low_memory: number;
    near_lossless: number;
    use_delta_palette: number;
    use_sharp_yuv: number;
  }

  export interface WebPModule extends EmscriptenWasm.Module {
    encode(
      data: BufferSource,
      width: number,
      height: number,
      options: WebPEncodeOptions,
    ): Uint8Array | null;
  }

  // Oxipng 编码器
  export interface OxipngModule {
    optimise(
      data: Uint8ClampedArray,
      width: number,
      height: number,
      level: number,
      interlace: boolean
    ): Uint8Array;
  }

  // AVIF 编码器
  export const enum AVIFTune {
    auto,
    psnr,
    ssim,
  }

  export interface AVIFEncodeOptions {
    quality: number;
    qualityAlpha: number;
    denoiseLevel: number;
    tileRowsLog2: number;
    tileColsLog2: number;
    speed: number;
    subsample: number;
    chromaDeltaQ: boolean;
    sharpness: number;
    enableSharpYUV: boolean;
    tune: AVIFTune;
  }

  export interface AVIFModule extends EmscriptenWasm.Module {
    encode(
      data: BufferSource,
      width: number,
      height: number,
      options: AVIFEncodeOptions,
    ): Uint8Array | null;
  }

  // 模块工厂函数
  declare var mozjpegModuleFactory: EmscriptenWasm.ModuleFactory<MozJPEGModule>;
  declare var webpModuleFactory: EmscriptenWasm.ModuleFactory<WebPModule>;
  declare var avifModuleFactory: EmscriptenWasm.ModuleFactory<AVIFModule>;

  export { mozjpegModuleFactory, webpModuleFactory, avifModuleFactory };
}

// Emscripten WASM 类型定义
declare namespace EmscriptenWasm {
  interface Module {
    readonly memory: WebAssembly.Memory;
    readonly HEAPU8: Uint8Array;
    readonly HEAPU16: Uint16Array;
    readonly HEAPU32: Uint32Array;
    readonly HEAPF32: Float32Array;
    readonly HEAPF64: Float64Array;
  }

  interface ModuleOpts {
    locateFile?: (path: string, scriptDirectory: string) => string;
    onRuntimeInitialized?: () => void;
    onAbort?: (what: any) => void;
    print?: (text: string) => void;
    printErr?: (text: string) => void;
    preRun?: Array<() => void>;
    postRun?: Array<() => void>;
    totalDependencies?: number;
    monitorRunDependencies?: (left: number) => void;
    noInitialRun?: boolean;
    noExitRuntime?: boolean;
    logReadFiles?: boolean;
    filePackagePrefixURL?: string;
    wasmBinary?: ArrayBuffer;
    wasmBinaryFile?: string;
    getPreloadedPackage?: (remotePackageName: string, remotePackageSize: number) => ArrayBuffer;
    instantiateWasm?: (imports: any, successCallback: (module: WebAssembly.Module) => void) => void;
    mainScriptUrlOrBlob?: string | Blob;
    pthreadMainPrefixURL?: string;
    pthreadWorkerPrefixURL?: string;
    cacheSuffix?: string;
    disableAutoFallback?: boolean;
    autoFallback?: boolean;
    wasmMemory?: WebAssembly.Memory;
    wasmTable?: WebAssembly.Table;
    dynamicLibraries?: Array<string>;
    loadDynamicLibraries?: boolean;
    dynamicLibraryPrefix?: string;
    allowUndefinedSymbols?: boolean;
    checkUndefinedSymbols?: boolean;
    usePreloadedCache?: boolean;
    preloadedWasm?: { [key: string]: ArrayBuffer };
    wasmPaths?: { [key: string]: string };
    wasmBinaryFile?: string;
    wasmBinary?: ArrayBuffer;
    wasmMemory?: WebAssembly.Memory;
    wasmTable?: WebAssembly.Table;
    wasmModule?: WebAssembly.Module;
    wasmInstance?: WebAssembly.Instance;
    wasmExports?: { [key: string]: any };
    wasmImports?: { [key: string]: any };
    wasmGlobals?: { [key: string]: any };
    wasmFunctions?: { [key: string]: any };
    wasmTables?: { [key: string]: any };
    wasmMemories?: { [key: string]: any };
    wasmElements?: { [key: string]: any };
    wasmData?: { [key: string]: any };
    wasmStart?: { [key: string]: any };
    wasmCode?: { [key: string]: any };
    wasmCustom?: { [key: string]: any };
    wasmEvents?: { [key: string]: any };
    wasmImports?: { [key: string]: any };
    wasmExports?: { [key: string]: any };
    wasmGlobals?: { [key: string]: any };
    wasmFunctions?: { [key: string]: any };
    wasmTables?: { [key: string]: any };
    wasmMemories?: { [key: string]: any };
    wasmElements?: { [key: string]: any };
    wasmData?: { [key: string]: any };
    wasmStart?: { [key: string]: any };
    wasmCode?: { [key: string]: any };
    wasmCustom?: { [key: string]: any };
    wasmEvents?: { [key: string]: any };
  }

  type ModuleFactory<T extends Module> = (opts?: ModuleOpts) => Promise<T>;
} 