// 使用 jSquash 库的图片压缩管理器
import { encode as encodeJpeg } from '@jsquash/jpeg';
import { encode as encodeWebP } from '@jsquash/webp';
// import { encode as encodePng } from '@jSquash/png';
import { encode as encodeAvif } from '@jsquash/avif';
import { encode as encodeJxl } from '@jsquash/jxl';
import { encode as encodeQoi } from '@jsquash/qoi';

import { optimise as optimisePng } from '@jsquash/oxipng';

class ImageCompressionManager {
  private static instance: ImageCompressionManager | null = null;
  private _isInitialized = false;

  // 获取单例实例
  public static getInstance(): ImageCompressionManager {
    if (!this.instance) {
      this.instance = new ImageCompressionManager();
    }
    return this.instance;
  }

  // 初始化（jSquash 不需要特殊初始化）
  public async initialize(): Promise<void> {
    this._isInitialized = true;
    // console.log('jSquash compression manager initialized');
  }

  // 压缩 JPEG 图片
  public async compressJpeg(imageData: ImageData, quality: number): Promise<Uint8Array> {
    if (!this._isInitialized) {
      throw new Error('Compression manager not initialized');
    }

    try {
      const result = await encodeJpeg(imageData, {
        quality: quality / 100 // jSquash 使用 0-1 范围
      });
      return new Uint8Array(result);
    } catch (error) {
      console.error('JPEG compression failed:', error);
      throw error;
    }
  }

  // 压缩 WebP 图片
  public async compressWebP(imageData: ImageData, quality: number): Promise<Uint8Array> {
    if (!this._isInitialized) {
      throw new Error('Compression manager not initialized');
    }

    try {
      const result = await encodeWebP(imageData, {
        quality: quality / 100 // jSquash 使用 0-1 范围
      });
      return new Uint8Array(result);
    } catch (error) {
      console.error('WebP compression failed:', error);
      throw error;
    }
  }

  // 压缩 PNG 图片 - 使用 oxipng 进行真正的压缩
  public async compressPng(imageData: ImageData, _quality: number): Promise<Uint8Array> {
    if (!this._isInitialized) {
      throw new Error('Compression manager not initialized');
    }

    try {
      // 先将 ImageData 编码为 PNG
      // const pngData = await encodePng(imageData, { bitDepth: 8 });
      
      // 使用 oxipng 优化 PNG（无损压缩）
      // 根据质量参数选择压缩级别：1-9，质量越高压缩级别越高
      const level = 6;
      const optimizedPng = await optimisePng(imageData, {
        level: level,
        interlace: false,
      });
      
      return new Uint8Array(optimizedPng);
    } catch (error) {
      console.error('PNG compression failed:', error);
      throw error;
    }
  }

  // 压缩 AVIF 图片
  public async compressAvif(imageData: ImageData, quality: number): Promise<Uint8Array> {
    if (!this._isInitialized) {
      throw new Error('Compression manager not initialized');
    }

    try {
      const result = await encodeAvif(imageData, {
        quality: quality / 100 // jSquash 使用 0-1 范围
      });
      return new Uint8Array(result);
    } catch (error) {
      console.error('AVIF compression failed:', error);
      throw error;
    }
  }

  // 压缩 JXL 图片
  public async compressJxl(imageData: ImageData, quality: number): Promise<Uint8Array> {
    if (!this._isInitialized) {
      throw new Error('Compression manager not initialized');
    }

    try {
      const result = await encodeJxl(imageData, {
        quality: quality / 100, // jSquash 使用 0-1 范围
        effort: 7 // 压缩努力程度 1-9，越高压缩效果越好但速度越慢
      });
      return new Uint8Array(result);
    } catch (error) {
      console.error('JXL compression failed:', error);
      throw error;
    }
  }

  // 压缩 QOI 图片
  public async compressQoi(imageData: ImageData, _quality: number): Promise<Uint8Array> {
    if (!this._isInitialized) {
      throw new Error('Compression manager not initialized');
    }

    try {
      // await init()
      // QOI 是无损格式，quality 参数在这里不起作用
      const result = await encodeQoi(imageData);
      return new Uint8Array(result);
    } catch (error) {
      console.error('QOI compression failed:', error);
      throw error;
    }
  }


  // 检查是否已初始化
  public isInitialized(): boolean {
    return this._isInitialized;
  }
}

export default ImageCompressionManager; 