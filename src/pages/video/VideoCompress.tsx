import React, { useRef, useState, useCallback } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/button';
import { UploadCloud, Download, RefreshCw, Trash2, Archive } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Trans, useTranslation } from 'react-i18next';
import { fetchFile } from '@ffmpeg/util';
import FFmpegManager from '@/lib/ffmpeg';

// 定义压缩格式类型
type VideoFormat = 'mp4' | 'webm';

// 定义压缩质量类型
type CompressionQuality = 'high' | 'medium' | 'low';

// 定义压缩结果类型
interface CompressionResult {
  id: string;
  originalFile: File;
  originalPreview: string;
  format: VideoFormat;
  quality: CompressionQuality;
  url: string;
  size: number;
  timestamp: number;
  isCompressing: boolean;  // 是否正在压缩中
  compressionProgress: number; // 压缩进度
  originalExt: string; // 原始文件扩展名
  duration?: number; // 视频时长(秒)
}

const VideoCompress = () => {
  const { t } = useTranslation();
  const [format, setFormat] = useState<VideoFormat>('mp4');
  const [quality, setQuality] = useState<CompressionQuality>('medium');
  const [compressionRatio, setCompressionRatio] = useState(70);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionResults, setCompressionResults] = useState<CompressionResult[]>([]);
  const [recompressingId, setRecompressingId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  
  // 在组件挂载时预加载FFmpeg
  React.useEffect(() => {
    // 预加载FFmpeg实例
    FFmpegManager.preload();
    
    // 组件卸载时释放FFmpeg实例
    return () => {
      FFmpegManager.releaseInstance();
    };
  }, []);
  
  // 从文件名获取视频格式
  const getVideoFormatFromFileName = (fileName: string): {format: VideoFormat, ext: string} => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (extension === 'mp4') {
      return { format: 'mp4', ext: extension };
    } else if (extension === 'webm') {
      return { format: 'webm', ext: extension };
    }
    
    // 默认使用mp4格式
    return { format: 'mp4', ext: 'mp4' };
  };

  // 处理文件选择和上传
  const processFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;
    
    // 添加视频到压缩结果列表，但设置为未压缩状态
    for (const file of files) {
      // 检查文件类型是否为视频
      if (!file.type.startsWith('video/')) continue;
      
      const fileId = generateId();
      const { format: fileFormat, ext: fileExt } = getVideoFormatFromFileName(file.name);
      
      // 创建预览
      const previewUrl = URL.createObjectURL(file);
      
      // 获取视频时长
      const duration = await getVideoDuration(file);
      
      // 添加到结果列表，但标记为正在压缩
      const newResult: CompressionResult = {
        id: fileId,
        originalFile: file,
        originalPreview: previewUrl,
        format: fileFormat, // 使用原视频格式
        url: '',  // 尚未压缩，URL为空
        size: 0,  // 尚未压缩，大小为0
        quality: quality, // 使用当前质量设置
        timestamp: Date.now(),
        isCompressing: true,  // 标记为正在压缩
        compressionProgress: 0,
        originalExt: fileExt, // 保存原始扩展名
        duration: duration
      };
      
      setCompressionResults(prev => [newResult, ...prev]);
      
      // 更新压缩状态
      setIsCompressing(true);
      
      // 立即开始压缩这个视频
      compressVideo(newResult);
    }
  };
  
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };
  
  // 处理文件上传
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      await processFiles(files);
      
      // 重置文件上传控件
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };
  
  // 拖拽事件处理函数
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 检查鼠标是否真的离开了元素(而不是进入了子元素)
    if (dropzoneRef.current && !dropzoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      await processFiles(files);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // 压缩视频 (使用Web API，FFmpeg.wasm)
  const compressVideo = async (result: CompressionResult) => {
    try {
      updateCompressionProgress(result.id, 5);
      
      // 获取压缩质量参数
      const compressionQuality = recompressingId === result.id ? quality : result.quality;
      const outputFormat = recompressingId === result.id ? format : result.format;
      
      // 获取共享的FFmpeg实例（等待加载完成）
      updateCompressionProgress(result.id, 10);
      
      // 如果FFmpeg还没加载完成，会在getInstance中等待加载完成
      const ffmpeg = await FFmpegManager.getInstance();
      
      updateCompressionProgress(result.id, 20);
      
      // 设置进度回调
      ffmpeg.on('progress', ({ progress }) => {
        updateCompressionProgress(result.id, 20 + progress * 70);
      });

      // 写入原始文件到虚拟文件系统
      const inputFileName = `input-${result.id}.${result.originalExt}`;
      const outputFileName = `output-${result.id}.${outputFormat}`;
      
      await ffmpeg.writeFile(inputFileName, await fetchFile(result.originalFile));
      updateCompressionProgress(result.id, 30);
      
      // 根据压缩质量设置参数
      let ffmpegArgs: string[] = [];
      
      if (outputFormat === 'mp4') {
        // 使用H.264编码器
        ffmpegArgs = [
          '-i', inputFileName,
          '-c:v', 'libx264',
          '-preset', compressionQuality === 'high' ? 'slow' : compressionQuality === 'medium' ? 'medium' : 'fast',
          '-crf', compressionQuality === 'high' ? '23' : compressionQuality === 'medium' ? '28' : '32',
          '-c:a', 'aac',
          '-b:a', '128k',
          outputFileName
        ];
      } else if (outputFormat === 'webm') {
        // 使用VP9编码器
        ffmpegArgs = [
          '-i', inputFileName,
          '-c:v', 'libvpx-vp9',
          '-b:v', compressionQuality === 'high' ? '1M' : compressionQuality === 'medium' ? '750K' : '500K',
          '-c:a', 'libopus',
          '-b:a', '128k',
          outputFileName
        ];
      }
      
      // 执行FFmpeg命令
      await ffmpeg.exec(ffmpegArgs);
      updateCompressionProgress(result.id, 90);
      
      // 读取压缩后的文件
      const compressedData = await ffmpeg.readFile(outputFileName);
      // 处理不同类型的返回值
      let compressedBuffer: Uint8Array;
      if (compressedData instanceof Uint8Array) {
        compressedBuffer = compressedData;
      } else if (typeof compressedData === 'object') {
        // 对于对象类型，尝试获取buffer或转换为Uint8Array
        compressedBuffer = new Uint8Array(compressedData as ArrayBuffer);
      } else {
        // 对于其他情况（如string），创建一个空的缓冲区
        console.error('Unexpected data type from FFmpeg:', typeof compressedData);
        compressedBuffer = new Uint8Array();
      }
      const compressedBlob = new Blob([compressedBuffer], { 
        type: outputFormat === 'mp4' ? 'video/mp4' : 'video/webm' 
      });
      const compressedUrl = URL.createObjectURL(compressedBlob);
      const compressedSize = compressedBlob.size;
      
      updateCompressionProgress(result.id, 95);
      
      // 更新结果
      setCompressionResults(prev => prev.map(r => {
        if (r.id === result.id) {
          return {
            ...r,
            url: compressedUrl,
            size: compressedSize,
            isCompressing: false,
            compressionProgress: 100,
            format: outputFormat,
            quality: compressionQuality
          };
        }
        return r;
      }));
      
      if (recompressingId === result.id) {
        setRecompressingId(null);
      }
      
      updateCompressionProgress(result.id, 100);
      
      // 检查是否所有视频都已完成压缩
      checkAllCompressionsCompleted();
    } catch (error) {
      console.error('Video compression error:', error);
      
      // 更新状态为压缩失败
      setCompressionResults(prev => prev.map(r => {
        if (r.id === result.id) {
          return {
            ...r,
            isCompressing: false,
            compressionProgress: 0
          };
        }
        return r;
      }));
      
      if (recompressingId === result.id) {
        setRecompressingId(null);
      }
      
      // 检查是否所有视频都已完成压缩
      checkAllCompressionsCompleted();
    }
  };
  
  // 检查是否所有视频压缩任务已完成
  const checkAllCompressionsCompleted = () => {
    // 延迟执行以确保状态已更新
    setTimeout(() => {
      // 检查是否还有正在压缩的视频
      const stillCompressing = compressionResults.some(result => result.isCompressing);
      
      if (!stillCompressing) {
        // 所有视频都已完成压缩，重置压缩状态
        setIsCompressing(false);
      }
    }, 100);
  };
  
  // 更新压缩进度
  const updateCompressionProgress = (id: string, progress: number) => {
    setCompressionResults(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          compressionProgress: progress
        };
      }
      return r;
    }));
  };
  
  // 生成唯一ID
  const generateId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };
  
  // 下载视频
  const handleDownload = (result: CompressionResult) => {
    // 创建下载链接
    const a = document.createElement('a');
    a.href = result.url;
    
    // 设置文件名
    const extension = result.format === 'mp4' ? 'mp4' : 'webm';
    const originalName = result.originalFile.name;
    const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    a.download = `${baseName}_compressed.${extension}`;
    
    // 触发下载
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  // 打包下载所有视频
  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const completedResults = compressionResults.filter(r => !r.isCompressing && r.url);
    
    if (completedResults.length === 0) {
      return;
    }
    
    // 设置下载状态
    setIsCompressing(true);
    
    for (let i = 0; i < completedResults.length; i++) {
      const result = completedResults[i];
      
      try {
        // 获取视频Blob
        const response = await fetch(result.url);
        const blob = await response.blob();
        
        // 设置文件名
        const extension = result.format === 'mp4' ? 'mp4' : 'webm';
        const originalName = result.originalFile.name;
        const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
        const fileName = `${baseName}_compressed.${extension}`;
        
        // 添加到zip
        zip.file(fileName, blob);
      } catch (error) {
        console.error('Error adding file to zip:', error);
      }
    }
    
    // 生成zip文件并下载
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'compressed_videos.zip');
    
    // 恢复状态
    setIsCompressing(false);
  };
  
  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  };
  
  // 计算压缩比例
  const getCompressionRatio = (original: number, compressed: number): string => {
    const ratio = ((original - compressed) / original) * 100;
    return `${ratio.toFixed(1)}%`;
  };
  
  // 删除结果
  const handleDeleteResult = (id: string) => {
    setCompressionResults(prev => prev.filter(r => r.id !== id));
  };
  
  // 格式化时间戳为日期
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // 格式化视频时长
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return t('videoCompress.unknown');
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <ToolLayout
      categoryId="video"
      toolId="video-compress"
      title={t('videoCompress.title')}
      description={`（${t('videoCompress.description')}）`}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div 
            ref={dropzoneRef}
            className={`md:col-span-3 border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer flex flex-col items-center justify-center ${isDragging ? 'border-primary bg-primary/5' : ''}`}
            onClick={() => document.getElementById('file-upload')?.click()}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              id="file-upload"
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={isCompressing}
            />
            <UploadCloud className={`mx-auto h-12 w-12 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <h3 className="text-lg font-medium mb-1">{isDragging ? t('videoCompress.dropToUpload') : t('videoCompress.clickOrDragToUpload')}</h3>
            <p className="text-sm text-muted-foreground">
              <Trans
                i18nKey="videoCompress.supportedFormats" 
                values={{ formats: 'MP4, WebM, MOV, AVI' }}
                components={{ 
                  span: <span className="text-primary font-medium" /> 
                }}
              />
            </p>

            {isCompressing && <p className="text-xs text-muted-foreground mt-2">{t('videoCompress.processingVideo')}</p>}
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">{t('videoCompress.compressionOptions')}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('videoCompress.outputFormat')}</label>
                <Select
                  value={format}
                  onValueChange={(value) => setFormat(value as VideoFormat)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('videoCompress.selectOutputFormat')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp4">MP4 ({t('videoCompress.recommended')})</SelectItem>
                    <SelectItem value="webm">WebM</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">{t('videoCompress.useOriginalFormat')}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">{t('videoCompress.compressionQuality')}</label>
                <Select
                  value={quality}
                  onValueChange={(value) => setQuality(value as CompressionQuality)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('videoCompress.selectCompressionQuality')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">{t('videoCompress.highQuality')}</SelectItem>
                    <SelectItem value="medium">{t('videoCompress.mediumQuality')}</SelectItem>
                    <SelectItem value="low">{t('videoCompress.lowQuality')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">{t('videoCompress.compressionRate', { rate: compressionRatio })}</label>
                <Slider
                  value={[compressionRatio]}
                  min={10}
                  max={90}
                  step={5}
                  onValueChange={(value: number[]) => setCompressionRatio(value[0])}
                  className="my-2"
                />
                <p className="text-xs text-muted-foreground">{t('videoCompress.compressionRateNote')}</p>
              </div>
            </div>
          </div>
        </div>
        
        {compressionResults.length > 0 && (
          <div className="rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">{t('videoCompress.compressionHistory', { count: compressionResults.length })}</h3>
              {compressionResults.filter(r => !r.isCompressing && r.url).length > 0 && (
                <Button
                  onClick={handleDownloadAll}
                  variant="outline"
                  size="sm"
                  disabled={compressionResults.filter(r => !r.isCompressing && r.url).length === 0}
                >
                  <Archive className="mr-2 h-3.5 w-3.5" />
                  {t('videoCompress.downloadAll')}
                </Button>
              )}
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-xs font-medium text-left py-2 px-3">{t('videoCompress.video')}</th>
                    <th className="text-xs font-medium text-left py-2 px-3">{t('videoCompress.fileInfo')}</th>
                    <th className="text-xs font-medium text-left py-2 px-3">{t('videoCompress.compressionInfo')}</th>
                    <th className="text-xs font-medium text-left py-2 px-3">{t('videoCompress.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {compressionResults.map((result) => (
                    <tr key={result.id} className="hover:bg-muted/30">
                      <td className="py-2 px-3 w-16">
                        <div className="relative w-12 h-12 bg-muted rounded overflow-hidden flex items-center justify-center">
                          <video 
                            src={result.originalPreview} 
                            className="max-w-full max-h-full object-contain" 
                            muted
                          />
                          
                          {result.isCompressing && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <RefreshCw className="animate-spin h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium truncate max-w-[150px]">{result.originalFile.name}</span>
                            <span className="text-xs text-muted-foreground">{formatTime(result.timestamp)}</span>
                          </div>
                          
                          {result.isCompressing ? (
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                              <div 
                                className="bg-primary h-full transition-all" 
                                style={{ width: `${result.compressionProgress}%` }}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{t('videoCompress.format')}: {result.format.toUpperCase()}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span>{t('videoCompress.duration')}: {formatDuration(result.duration)}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span>{t('videoCompress.quality')}: {
                                result.quality === 'high' 
                                  ? t('videoCompress.highQualityShort') 
                                  : result.quality === 'medium' 
                                    ? t('videoCompress.mediumQualityShort') 
                                    : t('videoCompress.lowQualityShort')
                              }</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        {result.isCompressing ? (
                          <div className="text-xs">{t('videoCompress.compressing')}</div>
                        ) : result.url ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs whitespace-nowrap">{t('videoCompress.originalVideo', { size: formatFileSize(result.originalFile.size) })}</span>
                            <span className="text-xs whitespace-nowrap">→</span>
                            <span className="text-xs whitespace-nowrap">{t('videoCompress.compressedVideo', { size: formatFileSize(result.size) })}</span>
                            <span className="text-xs text-green-500 whitespace-nowrap">(-{getCompressionRatio(result.originalFile.size, result.size)})</span>
                          </div>
                        ) : (
                          <div className="text-xs text-red-500">{t('videoCompress.compressionFailed')}</div>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1">
                          {!result.isCompressing && result.url && (
                            <Button 
                              onClick={() => handleDownload(result)}
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          
                          <Button 
                            onClick={() => handleDeleteResult(result.id)}
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            disabled={result.isCompressing}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {/* 隐藏的视频元素用于处理 */}
      <video ref={videoRef} className="hidden" />
    </ToolLayout>
  );
};

export default VideoCompress; 