import React, { useRef, useState, useCallback } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/button';
import { UploadCloud, Download, RefreshCw, Trash2, Archive } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useTranslation, Trans } from 'react-i18next';

// 定义压缩格式类型
type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif';


// 定义压缩结果类型
interface CompressionResult {
  id: string;
  originalFile: File;
  originalPreview: string;
  format: ImageFormat;
  url: string;
  size: number;
  quality: number;
  timestamp: number;
  isCompressing: boolean;  // 是否正在压缩中
  compressionProgress: number; // 压缩进度
  originalExt: string; // 原始文件扩展名
}

const ImageCompress = () => {
  const { t } = useTranslation();
  const [format, setFormat] = useState<ImageFormat>('webp');
  const [quality, setQuality] = useState(80);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionResults, setCompressionResults] = useState<CompressionResult[]>([]);
  const [recompressingId, setRecompressingId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  
  // 从文件名获取图片格式
  const getImageFormatFromFileName = (fileName: string): {format: ImageFormat, ext: string} => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (extension === 'jpg' || extension === 'jpeg') {
      return { format: 'jpeg', ext: extension };
    } else if (extension === 'png') {
      return { format: 'png', ext: extension };
    } else if (extension === 'webp') {
      return { format: 'webp', ext: extension };
    } else if (extension === 'avif') {
      return { format: 'avif', ext: extension };
    }
    
    // 默认使用webp格式
    return { format: 'webp', ext: 'webp' };
  };

  // 处理文件选择和上传
  const processFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;
    
    // 添加图片到压缩结果列表，但设置为未压缩状态
    for (const file of files) {
      // 检查文件类型是否为图片
      if (!file.type.startsWith('image/')) continue;
      
      const fileId = generateId();
      const { format: fileFormat, ext: fileExt } = getImageFormatFromFileName(file.name);
      
      // 创建预览
      const previewUrl = await createImagePreview(file);
      
      // 添加到结果列表，但标记为正在压缩
      const newResult: CompressionResult = {
        id: fileId,
        originalFile: file,
        originalPreview: previewUrl,
        format: fileFormat, // 使用原图格式
        url: '',  // 尚未压缩，URL为空
        size: 0,  // 尚未压缩，大小为0
        quality: quality, // 使用当前质量设置
        timestamp: Date.now(),
        isCompressing: true,  // 标记为正在压缩
        compressionProgress: 0,
        originalExt: fileExt // 保存原始扩展名
      };
      
      setCompressionResults(prev => [newResult, ...prev]);
      
      // 立即开始压缩这张图片
      compressImage(newResult);
    }
  };
  
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
  
  // 创建图片预览
  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  };
  
  // 压缩单张图片
  const compressImage = async (result: CompressionResult) => {
    if (!canvasRef.current) return;
    
    try {
      // 加载图片
      const img = new Image();
      img.src = result.originalPreview;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error(t('imageCompress.errors.canvasContextNotAvailable'));
        return;
      }
      
      // 设置canvas尺寸与原图一致
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 绘制图像到canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // 更新进度为50%（表示图像已加载和绘制）
      updateCompressionProgress(result.id, 50);
      
      // 根据选择的格式和质量进行压缩
      let compressedDataURL: string;
      const compressionFormat = recompressingId === result.id ? format : result.format;
      const compressionQuality = recompressingId === result.id ? quality : result.quality;
      
      if (compressionFormat === 'jpeg') {
        compressedDataURL = canvas.toDataURL('image/jpeg', compressionQuality / 100);
      } else if (compressionFormat === 'png') {
        compressedDataURL = canvas.toDataURL('image/png');
      } else if (compressionFormat === 'webp') {
        compressedDataURL = canvas.toDataURL('image/webp', compressionQuality / 100);
      } else if (compressionFormat === 'avif') {
        // 注意：不是所有浏览器都支持AVIF格式
        try {
          compressedDataURL = canvas.toDataURL('image/avif', compressionQuality / 100);
        } catch (error) {
          console.error(t('imageCompress.errors.avifNotSupported'), error);
          compressedDataURL = canvas.toDataURL('image/webp', compressionQuality / 100);
        }
      } else {
        compressedDataURL = canvas.toDataURL('image/webp', compressionQuality / 100);
      }
      
      // 更新进度为90%（表示压缩完成）
      updateCompressionProgress(result.id, 90);
      
      // 计算压缩后的大小
      const base64Data = compressedDataURL.split(',')[1];
      const byteCharacters = atob(base64Data);
      const compressedSize = byteCharacters.length;
      
      // 更新压缩结果
      setTimeout(() => {
        setCompressionResults(prev => 
          prev.map(item => 
            item.id === result.id 
              ? {
                  ...item,
                  url: compressedDataURL,
                  size: compressedSize,
                  format: compressionFormat,
                  quality: compressionQuality,
                  isCompressing: false,
                  compressionProgress: 100
                }
              : item
          )
        );
        
        if (recompressingId === result.id) {
          setRecompressingId(null);
        }
      }, 500); // 稍微延迟，让进度条动画更平滑
      
    } catch (error) {
      console.error(t('imageCompress.errors.compressionError'), error);
      
      // 压缩失败，更新状态
      setCompressionResults(prev => 
        prev.map(item => 
          item.id === result.id 
            ? { ...item, isCompressing: false }
            : item
        )
      );
      
      if (recompressingId === result.id) {
        setRecompressingId(null);
      }
    }
  };
  
  // 更新压缩进度
  const updateCompressionProgress = (id: string, progress: number) => {
    setCompressionResults(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, compressionProgress: progress }
          : item
      )
    );
  };
  
  
  // 生成唯一ID
  const generateId = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };
  
  // 下载压缩后的图片
  const handleDownload = (result: CompressionResult) => {
    if (result.isCompressing || !result.url) return;
    
    const a = document.createElement('a');
    a.href = result.url;
    
    // 设置文件名
    let fileName = result.originalFile.name || 'compressed-image';
    const dotIndex = fileName.lastIndexOf('.');
    if (dotIndex > 0) {
      fileName = fileName.substring(0, dotIndex);
    }
    
    // 使用原始扩展名，或者根据格式选择一个
    const ext = result.format === 'jpeg' ? (result.originalExt || 'jpg') : result.format;
    a.download = `${fileName}.${ext}`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  // 下载所有压缩后的图片到zip文件
  const handleDownloadAll = async () => {
    const completedResults = compressionResults.filter(r => !r.isCompressing && r.url);
    if (completedResults.length === 0) return;
    
    try {
      setIsCompressing(true); // 复用加载状态
      
      // 创建一个新的zip文件
      const zip = new JSZip();
      
      // 为每个压缩结果添加文件到zip
      for (let i = 0; i < completedResults.length; i++) {
        const result = completedResults[i];
        
        // 设置文件名
        let fileName = result.originalFile.name || 'compressed-image';
        const dotIndex = fileName.lastIndexOf('.');
        if (dotIndex > 0) {
          fileName = fileName.substring(0, dotIndex);
        }
        fileName = `${fileName}.${result.format}`;
        
        // 从dataURL提取base64数据
        const base64Data = result.url.split(',')[1];
        
        // 添加文件到zip
        zip.file(fileName, base64Data, { base64: true });
        
        // 更新进度
        const progressPercent = Math.round(((i + 1) / completedResults.length) * 100);
        updateCompressionProgress('zip-progress', progressPercent);
      }
      
      // 生成zip文件
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      }, (metadata) => {
        // 更新压缩进度
        updateCompressionProgress('zip-progress', metadata.percent | 0);
      });
      
      // 下载zip文件
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      saveAs(zipBlob, `compressed-images-${timestamp}.zip`);
    } catch (error) {
      console.error(t('imageCompress.errors.createZipError'), error);
      alert(t('imageCompress.errors.downloadFailed'));
    } finally {
      setIsCompressing(false);
    }
  };
  
  // 格式化文件大小显示
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  };
  
  // 计算压缩率
  const getCompressionRatio = (original: number, compressed: number): string => {
    if (original <= 0) return '0%';
    
    const ratio = ((original - compressed) / original) * 100;
    return `${ratio.toFixed(1)}%`;
  };
  
  // 删除压缩结果
  const handleDeleteResult = (id: string) => {
    setCompressionResults(prev => prev.filter(result => result.id !== id));
  };
  
  // 格式化时间
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  return (
    <ToolLayout
      title={t('imageCompress.title')}
      description={`（${t('imageCompress.description')}）`}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div 
            ref={dropzoneRef}
            className={`md:col-span-3 border-2 ${isDragging ? 'border-primary bg-primary/5' : 'border-dashed'} rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer`}
            onClick={() => document.getElementById('file-upload')?.click()}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              id="file-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <UploadCloud className={`mx-auto h-12 w-12 ${isDragging ? 'text-primary' : 'text-muted-foreground'} mb-4`} />
            <h3 className="text-lg font-medium mb-1">{isDragging ? t('imageCompress.dropToUpload') : t('imageCompress.clickOrDragToUpload')}</h3>
            <p className="text-sm text-muted-foreground">
              <Trans 
                i18nKey="imageCompress.supportedFormats" 
                values={{ formats: 'JPG, PNG, WebP, AVIF' }}
                components={{ 
                  span: <span className="text-primary font-medium" /> 
                }}
              />
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">{t('imageCompress.compressionOptions')}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('imageCompress.outputFormat')}</label>
                <Select
                  value={format}
                  onValueChange={(value) => setFormat(value as ImageFormat)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('imageCompress.selectOutputFormat')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webp">WebP ({t('common.recommended')})</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="avif">AVIF ({t('common.experimental')})</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">{t('imageCompress.useOriginalFormat')}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">{t('imageCompress.quality')}: {quality}%</label>
                <Slider
                  value={[quality]}
                  min={1}
                  max={100}
                  step={1}
                  onValueChange={(value: number[]) => setQuality(value[0])}
                  className="my-2"
                />
              </div>
            </div>
          </div>
        </div>
        
        {compressionResults.length > 0 && (
          <div className="rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">{t('imageCompress.compressionHistory')} ({compressionResults.length})</h3>
              {compressionResults.filter(r => !r.isCompressing && r.url).length > 0 && (
                <Button
                  onClick={handleDownloadAll}
                  variant="outline"
                  size="sm"
                  disabled={isCompressing}
                >
                  <Archive className="mr-2 h-3.5 w-3.5" />
                  {t('imageCompress.downloadAll')}
                </Button>
              )}
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-xs font-medium text-left py-2 px-3">{t('imageCompress.image')}</th>
                    <th className="text-xs font-medium text-left py-2 px-3">{t('imageCompress.fileInfo')}</th>
                    <th className="text-xs font-medium text-left py-2 px-3">{t('imageCompress.compressionInfo')}</th>
                    <th className="text-xs font-medium text-left py-2 px-3">{t('imageCompress.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {compressionResults.map((result) => (
                    <tr key={result.id} className="hover:bg-muted/30">
                      <td className="py-2 px-3 w-16">
                        <div className="relative w-12 h-12 bg-muted rounded overflow-hidden flex items-center justify-center">
                          <img 
                            src={result.isCompressing ? result.originalPreview : result.url || result.originalPreview} 
                            alt={t('imageCompress.preview')} 
                            className="max-w-full max-h-full object-contain" 
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
                              <span>{t('imageCompress.format')}: {result.format === 'jpeg' ? result.originalExt.toUpperCase() : result.format.toUpperCase()}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span>{t('imageCompress.quality')}: {result.quality}%</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        {result.isCompressing ? (
                          <div className="text-xs">{t('imageCompress.compressing')}...</div>
                        ) : result.url ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs whitespace-nowrap">{t('imageCompress.original')}: {formatFileSize(result.originalFile.size)}</span>
                            <span className="text-xs whitespace-nowrap">→</span>
                            <span className="text-xs whitespace-nowrap">{t('imageCompress.compressed')}: {formatFileSize(result.size)}</span>
                            <span className="text-xs text-green-500 whitespace-nowrap">(-{getCompressionRatio(result.originalFile.size, result.size)})</span>
                          </div>
                        ) : (
                          <div className="text-xs text-red-500">{t('imageCompress.compressionFailed')}</div>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1">
                          {!result.isCompressing && result.url && (
                            <>
                              <Button 
                                onClick={() => handleDownload(result)}
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                             
                            </>
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
      
      {/* 隐藏的canvas用于图片处理 */}
      <canvas ref={canvasRef} className="hidden" />
    </ToolLayout>
  );
};

export default ImageCompress; 