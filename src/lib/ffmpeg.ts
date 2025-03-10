import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

class FFmpegManager {
  private static instance: FFmpeg | null = null;
  private static isLoading = false;
  private static loadingPromise: Promise<void> | null = null;

  // 获取FFmpeg实例（懒加载）
  public static async getInstance(): Promise<FFmpeg> {
    // 如果已经有实例，直接返回
    if (this.instance) {
      return this.instance;
    }

    // 如果正在加载中，等待加载完成
    if (this.isLoading && this.loadingPromise) {
      await this.loadingPromise;
      return this.instance!;
    }

    // 开始加载
    this.isLoading = true;
    this.instance = new FFmpeg();

    // 创建加载Promise
    this.loadingPromise = (async () => {
      try {
        // 加载本地wasm文件而非从CDN获取
        const localBaseURL = '/ffmpeg';
        // 也可以选择从CDN加载，但使用更快的CDN，比如从jsdelivr获取
        const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';
        
        await this.instance!.load({
          coreURL: await toBlobURL(`${localBaseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        
        console.log('FFmpeg loaded successfully');
      } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        this.instance = null;
        throw error;
      } finally {
        this.isLoading = false;
        this.loadingPromise = null;
      }
    })();

    await this.loadingPromise;
    return this.instance!;
  }

  // 预加载FFmpeg（可在应用启动时调用）
  public static preload(): void {
    this.getInstance().catch(console.error);
  }

  // 释放FFmpeg实例
  public static async releaseInstance(): Promise<void> {
    if (this.instance) {
      await this.instance.terminate();
      this.instance = null;
    }
  }
}

export default FFmpegManager; 