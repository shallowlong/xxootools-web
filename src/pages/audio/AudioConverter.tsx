/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import ToolLayout from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadCloud, FileAudio, Download, Trash2, Archive } from 'lucide-react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { fetchFile } from '@ffmpeg/util';
import FFmpegManager from '@/lib/ffmpeg';

// 定义音频格式类型
type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'aac' | 'm4a' | 'flac';

// 定义音频质量类型
type AudioQuality = 'high' | 'medium' | 'low';

// 定义采样率类型
type SampleRate = '44100' | '48000' | '96000';

// 定义比特率类型
type BitRate = '64' | '128' | '192' | '256' | '320';

// 定义音频转换结果类型
interface ConversionResult {
  id: string;
  originalFile: File;
  format: AudioFormat;
  quality: AudioQuality;
  sampleRate: SampleRate;
  bitRate: BitRate;
  url: string;
  size: number;
  timestamp: number;
  isConverting: boolean;
  conversionProgress: number;
  originalExt: string;
  duration?: number;
}

const AudioConverter = () => {
  const { t } = useTranslation();
  // 虽然这些变量没有在JSX中直接使用，但在处理音频上传和转换的函数中被使用
  const [, setSelectedFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<AudioFormat>('mp3');
  const [quality, setQuality] = useState<AudioQuality>('medium');
  const [sampleRate, setSampleRate] = useState<SampleRate>('44100');
  const [bitRate, setBitRate] = useState<BitRate>('192');
  const [compressionRatio, setCompressionRatio] = useState(70);
  
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResults, setConversionResults] = useState<ConversionResult[]>([]);
  const [reconvertingId, setReconvertingId] = useState<string | null>(null);
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
  
  // 从文件名获取音频格式
  const getAudioFormatFromFileName = (fileName: string): { format: AudioFormat, ext: string } => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (extension === 'mp3') return { format: 'mp3', ext: extension };
    if (extension === 'wav') return { format: 'wav', ext: extension };
    if (extension === 'ogg') return { format: 'ogg', ext: extension };
    if (extension === 'aac') return { format: 'aac', ext: extension };
    if (extension === 'm4a') return { format: 'm4a', ext: extension };
    if (extension === 'flac') return { format: 'flac', ext: extension };
    
    // 默认使用mp3格式
    return { format: 'mp3', ext: 'mp3' };
  };

  // 处理文件选择和上传
  const processFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;
    
    // 添加音频到转换结果列表，但设置为未转换状态
    for (const file of files) {
      // 检查文件类型是否为音频
      if (!file.type.startsWith('audio/')) continue;
      
      const fileId = generateId();
      const { ext: fileExt } = getAudioFormatFromFileName(file.name);
      
      // 获取音频时长
      const duration = await getAudioDuration(file);
      
      // 添加到结果列表，但标记为正在转换
      const newResult: ConversionResult = {
        id: fileId,
        originalFile: file,
        format: outputFormat,
        url: '',  // 尚未转换，URL为空
        size: 0,  // 尚未转换，大小为0
        quality,
        sampleRate,
        bitRate,
        timestamp: Date.now(),
        isConverting: true,
        conversionProgress: 0,
        originalExt: fileExt,
        duration
      };
      
      setConversionResults(prev => [newResult, ...prev]);
      setSelectedFile(file);
      
      // 更新转换状态
      setIsConverting(true);
      
      // 立即开始转换这个音频
      convertAudio(newResult);
    }
  };
  
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        window.URL.revokeObjectURL(audio.src);
        resolve(audio.duration);
      };
      audio.src = URL.createObjectURL(file);
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
  }, []);
  
  // 转换音频 (使用Web API，FFmpeg.wasm)
  const convertAudio = async (result: ConversionResult) => {
    try {
      updateConversionProgress(result.id, 5);
      
      // 获取转换参数
      const conversionQuality = reconvertingId === result.id ? quality : result.quality;
      const convertedFormat = reconvertingId === result.id ? outputFormat : result.format;
      const outputSampleRate = reconvertingId === result.id ? sampleRate : result.sampleRate;
      const outputBitRate = reconvertingId === result.id ? bitRate : result.bitRate;
      
      // 获取共享的FFmpeg实例（等待加载完成）
      updateConversionProgress(result.id, 10);
      
      // 如果FFmpeg还没加载完成，会在getInstance中等待加载完成
      const ffmpeg = await FFmpegManager.getInstance();
      
      updateConversionProgress(result.id, 20);
      
      // 设置进度回调
      ffmpeg.on('progress', ({ progress }) => {
        updateConversionProgress(result.id, 20 + progress * 70);
      });

      // 写入原始文件到虚拟文件系统
      const inputFileName = `input-${result.id}.${result.originalExt}`;
      const outputFileName = `output-${result.id}.${convertedFormat}`;
      
      await ffmpeg.writeFile(inputFileName, await fetchFile(result.originalFile));
      updateConversionProgress(result.id, 30);
      
      // 根据音频格式和质量设置FFmpeg参数
      let ffmpegArgs: string[] = [];
      
      // 基础命令
      ffmpegArgs = [
        '-i', inputFileName,
        '-ar', outputSampleRate,
      ];
      
      // 根据格式和质量添加特定参数
      switch (convertedFormat) {
        case 'mp3':
          ffmpegArgs.push(
            '-c:a', 'libmp3lame',
            '-b:a', `${outputBitRate}k`,
            '-q:a', conversionQuality === 'high' ? '0' : conversionQuality === 'medium' ? '4' : '7'
          );
          break;
        case 'aac':
          ffmpegArgs.push(
            '-c:a', 'aac',
            '-b:a', `${outputBitRate}k`,
            '-q:a', conversionQuality === 'high' ? '1' : conversionQuality === 'medium' ? '3' : '5'
          );
          break;
        case 'ogg':
          ffmpegArgs.push(
            '-c:a', 'libvorbis',
            '-b:a', `${outputBitRate}k`,
            '-q:a', conversionQuality === 'high' ? '6' : conversionQuality === 'medium' ? '4' : '2'
          );
          break;
        case 'wav':
          // WAV是无损格式，不需要指定比特率
          ffmpegArgs.push('-c:a', 'pcm_s16le');
          break;
        case 'flac':
          // FLAC是无损格式，但可以设置压缩级别
          ffmpegArgs.push(
            '-c:a', 'flac',
            '-compression_level', conversionQuality === 'high' ? '12' : conversionQuality === 'medium' ? '8' : '5'
          );
          break;
        case 'm4a':
          ffmpegArgs.push(
            '-c:a', 'aac',
            '-b:a', `${outputBitRate}k`,
            '-q:a', conversionQuality === 'high' ? '1' : conversionQuality === 'medium' ? '3' : '5'
          );
          break;
        default:
          // 默认使用AAC编码
          ffmpegArgs.push(
            '-c:a', 'aac',
            '-b:a', `${outputBitRate}k`
          );
      }
      
      // 添加输出文件名
      ffmpegArgs.push(outputFileName);
      
      // 执行FFmpeg命令
      await ffmpeg.exec(ffmpegArgs);
      updateConversionProgress(result.id, 90);
      
      // 读取转换后的文件
      const convertedData = await ffmpeg.readFile(outputFileName);
      // 处理不同类型的返回值
      let convertedBuffer: Uint8Array;
      if (convertedData instanceof Uint8Array) {
        convertedBuffer = convertedData;
      } else if (typeof convertedData === 'object') {
        // 对于对象类型，尝试转换为Uint8Array
        convertedBuffer = new Uint8Array(convertedData as ArrayBuffer);
      } else {
        // 对于其他情况，创建一个空的缓冲区
        console.error('意外的数据类型:', typeof convertedData);
        convertedBuffer = new Uint8Array();
      }
      
      // 创建Blob和URL
      const mimeTypes: Record<AudioFormat, string> = {
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'aac': 'audio/aac',
        'm4a': 'audio/mp4',
        'flac': 'audio/flac'
      };
      
      const convertedBlob = new Blob([convertedBuffer], { type: mimeTypes[convertedFormat] });
      const convertedUrl = URL.createObjectURL(convertedBlob);
      const convertedSize = convertedBlob.size;
      
      updateConversionProgress(result.id, 95);
      
      // 更新结果
      setConversionResults(prev => prev.map(r => {
        if (r.id === result.id) {
          return {
            ...r,
            url: convertedUrl,
            size: convertedSize,
            isConverting: false,
            conversionProgress: 100,
            format: convertedFormat,
            quality: conversionQuality,
            sampleRate: outputSampleRate,
            bitRate: outputBitRate
          };
        }
        return r;
      }));
      
      if (reconvertingId === result.id) {
        setReconvertingId(null);
      }
      
      updateConversionProgress(result.id, 100);
      
      // 检查是否所有音频都已完成转换
      checkAllConversionsCompleted();
    } catch (error) {
      console.error('音频转换错误:', error);
      
      // 更新状态为转换失败
      setConversionResults(prev => prev.map(r => {
        if (r.id === result.id) {
          return {
            ...r,
            isConverting: false,
            conversionProgress: 0
          };
        }
        return r;
      }));
      
      if (reconvertingId === result.id) {
        setReconvertingId(null);
      }
      
      // 检查是否所有音频都已完成转换
      checkAllConversionsCompleted();
    }
  };
  
  // 检查是否所有音频转换任务已完成
  const checkAllConversionsCompleted = () => {
    // 延迟执行以确保状态已更新
    setTimeout(() => {
      // 检查是否还有正在转换的音频
      const stillConverting = conversionResults.some(result => result.isConverting);
      
      if (!stillConverting) {
        setIsConverting(false);
      }
    }, 100);
  };
  
  // 更新转换进度
  const updateConversionProgress = (id: string, progress: number) => {
    setConversionResults(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, conversionProgress: progress };
      }
      return r;
    }));
  };
  
  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };
  
  // 处理下载
  const handleDownload = (result: ConversionResult) => {
    // 检查是否有URL
    if (!result.url) return;
    
    // 创建文件名
    const fileName = `${result.originalFile.name.split('.').slice(0, -1).join('.')}.${result.format}`;
    
    // 下载文件
    saveAs(result.url, fileName);
  };
  
  // 删除结果
  const handleDeleteResult = (id: string) => {
    setConversionResults(prev => prev.filter(r => r.id !== id));
  };
  
  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  
  // 计算压缩比例
  const getCompressionRatio = (original: number, converted: number): string => {
    return ((1 - (converted / original)) * 100).toFixed(1) + '%';
  };
  
  // 格式化时长
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '未知';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  // 处理批量下载
  const handleBatchDownload = async () => {
    // 过滤出已转换完成的结果
    const completedResults = conversionResults.filter(r => !r.isConverting && r.url);
    
    if (completedResults.length === 0) return;
    
    try {
      const zip = new JSZip();
      const promises = completedResults.map(async (result) => {
        // 获取文件数据
        const response = await fetch(result.url);
        const blob = await response.blob();
        
        // 创建文件名
        const fileName = `${result.originalFile.name.split('.').slice(0, -1).join('.')}.${result.format}`;
        
        // 添加到zip
        zip.file(fileName, blob);
      });
      
      // 等待所有文件添加完成
      await Promise.all(promises);
      
      // 生成zip文件并下载
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `音频转换结果_${new Date().getTime()}.zip`);
    } catch (error) {
      console.error('Batch download error:', error);
    }
  };
  
  return (
    <ToolLayout
      categoryId="audio"
      toolId="audio-converter"
      title={t('audioConverter.title')}
      description={`（${t('audioConverter.description')}）`}
    >
      <div className="space-y-6">
        {/* 上传区域 */}
        <div 
          ref={dropzoneRef}
          className={`border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : ''}`}
          onClick={() => document.getElementById('file-upload')?.click()}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            id="file-upload"
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isConverting}
          />
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">{t('audioConverter.dropzone.title')}</h3>
          <p className="text-sm text-muted-foreground">
            <Trans 
              i18nKey="audioConverter.dropzone.description" 
              values={{ formats: 'MP3, WAV, OGG, AAC, M4A, FLAC' }}
              components={{ 
                span: <span className="text-primary font-medium" /> 
              }}
            />
          </p>
        </div>
        
        {/* 转换选项 */}
        <div className="border rounded-lg p-4 space-y-5">
          <h3 className="text-lg font-medium">{t('audioConverter.options.title')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 输出格式 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('audioConverter.options.outputFormat')}</label>
              <Select value={outputFormat} onValueChange={(value) => setOutputFormat(value as AudioFormat)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('audioConverter.options.selectFormat')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp3">{t('audioConverter.formats.mp3')}</SelectItem>
                  <SelectItem value="wav">{t('audioConverter.formats.wav')}</SelectItem>
                  <SelectItem value="ogg">{t('audioConverter.formats.ogg')}</SelectItem>
                  <SelectItem value="aac">{t('audioConverter.formats.aac')}</SelectItem>
                  <SelectItem value="m4a">{t('audioConverter.formats.m4a')}</SelectItem>
                  <SelectItem value="flac">{t('audioConverter.formats.flac')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 音频质量 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('audioConverter.options.quality')}</label>
              <Select value={quality} onValueChange={(value) => setQuality(value as AudioQuality)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('audioConverter.options.selectQuality')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">{t('audioConverter.quality.high')}</SelectItem>
                  <SelectItem value="medium">{t('audioConverter.quality.medium')}</SelectItem>
                  <SelectItem value="low">{t('audioConverter.quality.low')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 采样率 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('audioConverter.options.sampleRate')}</label>
              <Select value={sampleRate} onValueChange={(value) => setSampleRate(value as SampleRate)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('audioConverter.options.selectSampleRate')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="44100">44.1 kHz</SelectItem>
                  <SelectItem value="48000">48 kHz</SelectItem>
                  <SelectItem value="96000">96 kHz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 比特率 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('audioConverter.options.bitRate')}</label>
              <Select value={bitRate} onValueChange={(value) => setBitRate(value as BitRate)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('audioConverter.options.selectBitRate')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="64">64 kbps</SelectItem>
                  <SelectItem value="128">128 kbps</SelectItem>
                  <SelectItem value="192">192 kbps</SelectItem>
                  <SelectItem value="256">256 kbps</SelectItem>
                  <SelectItem value="320">320 kbps</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* 压缩率滑块 */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">{t('audioConverter.options.compressionRatio')}</label>
              <span className="text-sm font-mono">{compressionRatio}%</span>
            </div>
            <Slider
              value={[compressionRatio]}
              onValueChange={(value) => setCompressionRatio(value[0])}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>
        
        {/* 转换结果列表 */}
        {conversionResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">{t('audioConverter.results.title')}</h3>
              {conversionResults.length >= 2 && (
                <Button variant="outline" size="sm" onClick={handleBatchDownload}>
                  <Archive className="h-4 w-4 mr-2" />
                  {t('audioConverter.actions.downloadAll')}
                </Button>
              )}
            </div>
            
            <div className="space-y-4">
              {conversionResults.map((result) => (
                <div key={result.id} className="border rounded-lg p-4 relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <FileAudio className="h-5 w-5 mr-2 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium text-sm">{result.originalFile.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {t('audioConverter.results.originalFormat')}: {result.originalExt.toUpperCase()} • 
                          {t('audioConverter.results.fileSize')}: {formatFileSize(result.originalFile.size)} •
                          {result.duration && <> {t('audioConverter.results.duration')}: {formatDuration(result.duration)} •</>}
                          {t('audioConverter.results.uploadTime')}: {new Date(result.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownload(result)}
                        disabled={result.isConverting}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {t('audioConverter.actions.download')}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteResult(result.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  
                  {result.isConverting ? (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{t('audioConverter.results.converting')}</span>
                        <span>{Math.round(result.conversionProgress)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 dark:bg-gray-700">
                        <div 
                          className="bg-primary h-1.5 rounded-full" 
                          style={{ width: `${result.conversionProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                      <div>
                        <span className="text-xs font-medium">{t('audioConverter.results.targetFormat')}</span>
                        <p className="text-sm">{result.format.toUpperCase()}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium">{t('audioConverter.results.convertedSize')}</span>
                        <p className="text-sm">{formatFileSize(result.size)}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium">{t('audioConverter.results.compressionRatio')}</span>
                        <p className="text-sm">{getCompressionRatio(result.originalFile.size, result.size)}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default AudioConverter; 