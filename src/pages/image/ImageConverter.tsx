import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import ToolLayout from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/button';
import { UploadCloud, Download, Trash2, Archive, RefreshCw } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ImageCompressionManager from '@/lib/squoosh-wasm';
import heic2any from 'heic2any';

// 定义转换格式类型
type ImageFormat = 'webp' | 'png' | 'jpg' | 'jxl' | 'avif';

// 定义转换结果类型
interface ConversionResult {
  id: string;
  originalFile: File;
  originalPreview: string;
  originalFormat: string;
  targetFormat: ImageFormat;
  url: string;
  isConverting: boolean;
  conversionProgress: number;
  timestamp: number;
  error?: string; // 错误信息
  convertedSize?: number; // 转换后的文件大小
}

const ImageConverter = () => {
  const { t } = useTranslation();
  const [targetFormat, setTargetFormat] = useState<ImageFormat>('webp');
  const [conversionResults, setConversionResults] = useState<ConversionResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  // 初始化压缩引擎
  useEffect(() => {
    const initializeCompression = async () => {
      try {
        
        const manager = ImageCompressionManager.getInstance();
        await manager.initialize();
        setIsInitialized(true);
        
      } catch (error) {
        
        setInitializationError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    initializeCompression();
  }, []);
  
  // 获取文件格式
  const getImageFormatFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    return extension;
  };
  
  // 生成唯一ID
  const generateId = () => {
    return Math.random().toString(36).substring(2, 9);
  };
  
  // 处理文件选择和上传
  const processFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;
    
    // 添加图片到转换结果列表
    for (const file of files) {
      // 检查文件类型是否为图片
      if (!file.type.startsWith('image/')) continue;
      
      const fileId = generateId();
      const originalFormat = getImageFormatFromFileName(file.name);
      
      // 创建预览
      const previewUrl = await createImagePreview(file);
      
      // 添加到结果列表，标记为正在转换
      const newResult: ConversionResult = {
        id: fileId,
        originalFile: file,
        originalPreview: previewUrl,
        originalFormat,
        targetFormat, // 使用当前选择的格式
        url: '',  // 尚未转换，URL为空
        isConverting: true,
        conversionProgress: 0,
        timestamp: Date.now(),
      };
      
      setConversionResults(prev => [newResult, ...prev]);
      
      // 立即开始转换这张图片
      convertImage(newResult);
    }
  };
  
  // 处理文件选择
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
  
  // 更新转换进度
  const updateConversionProgress = (id: string, progress: number) => {
    setConversionResults(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, conversionProgress: progress }
          : item
      )
    );
  };
  
  // 获取目标格式的MIME类型
  const getTargetMimeType = (format: ImageFormat): string => {
    switch (format) {
      case 'jpg':
        return 'image/jpeg';
      case 'jxl':
        return 'image/jxl';
      // case 'qoi':
      //   return 'image/qoi';
      case 'avif':
        return 'image/avif';
      default:
        return `image/${format}`;
    }
  };

    // 使用压缩管理器进行图片格式转换
  const convertWithCompressionManager = async (imageData: ImageData, format: ImageFormat): Promise<Uint8Array> => {
    const compressionManager = ImageCompressionManager.getInstance();
    
    // 确保压缩管理器已初始化
    if (!compressionManager.isInitialized()) {
      await compressionManager.initialize();
    }
    
    switch (format) {
      case 'webp':
        return await compressionManager.compressWebP(imageData, 100);
      case 'png':
        return await compressionManager.compressPng(imageData, 100);
      case 'jpg':
        return await compressionManager.compressJpeg(imageData, 100);
      case 'jxl':
        return await compressionManager.compressJxl(imageData, 100);
      // case 'qoi':
      //   return await compressionManager.compressQoi(imageData, 100);
      case 'avif':
        return await compressionManager.compressAvif(imageData, 100);
      default:
        throw new Error(`不支持的格式: ${format}`);
    }
  };

  // 将文件转换为 ImageData
  const fileToImageData = async (file: File): Promise<ImageData> => {
    try {
      // 使用 createImageBitmap 和 OffscreenCanvas 获取 ImageData
      const bitmap = await createImageBitmap(file);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context not available');
      }
      
      // 绘制图像到 canvas
      ctx.drawImage(bitmap, 0, 0);
      
      // 获取 ImageData
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return imageData;
    } catch (error) {
      throw new Error('Failed to convert file to ImageData');
    }
  };

  // 转换单张图片
  const convertImage = async (result: ConversionResult) => {
    // 检查是否是HEIC文件
    const isHeicFile = result.originalFile.name.toLowerCase().endsWith('.heic') || 
                      result.originalFile.type === 'image/heic';

    if (isHeicFile) {
      // HEIC文件直接使用heic2any转换
      try {
        updateConversionProgress(result.id, 20);
        
        // 根据目标格式选择转换类型
        let toType: string;
        switch (result.targetFormat) {
          case 'jpg':
            toType = 'image/jpeg';
            break;
          case 'png':
            toType = 'image/png';
            break;
          case 'webp':
            toType = 'image/webp';
            break;
          default:
            toType = 'image/jpeg'; // 默认转换为JPEG
        }
        
        updateConversionProgress(result.id, 50);
        
        // 使用heic2any直接转换
        const convertedBlob = await heic2any({
          blob: result.originalFile,
          toType: toType as any,
          quality: 1.0
        });
        
        updateConversionProgress(result.id, 90);
        
        // 确保是单个Blob
        const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        const convertedDataURL = URL.createObjectURL(finalBlob);
        
        // 计算转换后的文件大小
        const convertedSize = finalBlob.size;
        
        // 更新转换结果
        setTimeout(() => {
          setConversionResults(prev => 
            prev.map(item => 
              item.id === result.id 
                ? {
                    ...item,
                    url: convertedDataURL,
                    convertedSize,
                    isConverting: false,
                    conversionProgress: 100
                  }
                : item
            )
          );
        }, 300);
        
      } catch (error) {
        console.error('HEIC conversion failed:', error);
        setConversionResults(prev => 
          prev.map(item => 
            item.id === result.id 
              ? { 
                  ...item, 
                  isConverting: false,
                  url: '',
                  convertedSize: undefined,
                  conversionProgress: 0,
                  error: error instanceof Error ? error.message : 'HEIC转换失败'
                }
              : item
          )
        );
      }
      return;
    }

    // 非HEIC文件使用原有的squoosh流程
    if (!isInitialized) {
      console.error('Conversion engine not initialized yet');
      setConversionResults(prev => 
        prev.map(item => 
          item.id === result.id 
            ? { 
                ...item, 
                isConverting: false,
                url: '',
                convertedSize: undefined,
                conversionProgress: 0,
                error: '转换引擎未初始化'
              }
            : item
        )
      );
      return;
    }

    try {
      updateConversionProgress(result.id, 20);
      
      // 将文件转换为 ImageData
      const imageData = await fileToImageData(result.originalFile);
      
      updateConversionProgress(result.id, 50);
      
      // 使用压缩管理器进行格式转换
      const convertedData = await convertWithCompressionManager(imageData, result.targetFormat);
      
      updateConversionProgress(result.id, 90);
      
      // 将Uint8Array转换为Blob URL
      const blob = new Blob([convertedData], { type: getTargetMimeType(result.targetFormat) });
      const convertedDataURL = URL.createObjectURL(blob);
      
      // 计算转换后的文件大小
      const convertedSize = convertedData.length;
      
      // 更新转换结果
      setTimeout(() => {
        setConversionResults(prev => 
          prev.map(item => 
            item.id === result.id 
              ? {
                  ...item,
                  url: convertedDataURL,
                  convertedSize,
                  isConverting: false,
                  conversionProgress: 100
                }
              : item
          )
        );
      }, 300);
      
    } catch (error) {
      console.error(t('imageConverter.errors.conversionError'), error);
      
      // 转换失败，更新状态
      setConversionResults(prev => 
        prev.map(item => 
          item.id === result.id 
            ? { 
                ...item, 
                isConverting: false,
                url: '', // 清空URL表示转换失败
                convertedSize: undefined, // 清空转换后大小
                conversionProgress: 0,
                error: error instanceof Error ? error.message : '转换失败'
              }
            : item
        )
      );
    }
  };
  
  // 下载转换后的图片
  const handleDownload = async (result: ConversionResult) => {
    if (!result.url) return;
    
    try {
      // 从Blob URL获取Blob对象
      const response = await fetch(result.url);
      const blob = await response.blob();
      
      // 创建下载链接
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      
      // 修改文件扩展名
      const originalName = result.originalFile.name;
      const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
      a.download = `${nameWithoutExt}.${result.targetFormat}`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // 清理临时URL
      URL.revokeObjectURL(a.href);
    } catch (error) {
      console.error('下载失败:', error);
    }
  };
  
  // 批量下载所有转换后的图片
  const handleBatchDownload = async () => {
    // 获取所有已完成转换的结果
    const completedResults = conversionResults.filter(result => !result.isConverting && result.url);
    
    if (completedResults.length === 0) return;
    
    const zip = new JSZip();
    
    // 添加每个图片到zip
    for (const result of completedResults) {
      try {
        // 从Blob URL获取Blob对象
        const response = await fetch(result.url);
        const blob = await response.blob();
        
        // 获取文件名
        const originalName = result.originalFile.name;
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
        const fileName = `${nameWithoutExt}.${result.targetFormat}`;
        
        // 添加到zip
        zip.file(fileName, blob);
      } catch (error) {
        console.error(`添加文件到ZIP失败: ${result.originalFile.name}`, error);
      }
    }
    
    try {
      // 生成zip文件
      const content = await zip.generateAsync({ type: 'blob' });
      
      // 下载zip文件
      const date = new Date().toISOString().slice(0, 10);
      saveAs(content, `${t('imageConverter.title')}_${date}.zip`);
    } catch (error) {
      console.error(t('imageConverter.errors.createZipError'), error);
    }
  };
  
  // 删除转换结果
  const handleDeleteResult = (id: string) => {
    setConversionResults(prev => prev.filter(item => item.id !== id));
  };
  
  // 格式化时间
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
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
  
  // 计算转换率 - 文件大小变化比例
  const getConversionRatio = (original: number, converted: number): string => {
    if (original <= 0) return '0%';
    
    const ratio = ((original - converted) / original) * 100;
    return ratio > 0 ? `${ratio.toFixed(1)}%` : `+${Math.abs(ratio).toFixed(1)}%`;
  };

  
  return (
    <ToolLayout
      categoryId="image"
      toolId="image-converter"
      title={t('imageConverter.title')}
      description={`（${t('imageConverter.description')}）`}
    >
            <div className="space-y-6">
        {/* 初始化状态显示 */}
        {!isInitialized && !initializationError && (
          <div className="text-center py-8">
            <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">convert initializing...</p>
          </div>
        )}
        
        {initializationError && (
          <div className="text-center py-8">
            <p className="text-red-500 mb-2">convert initialization failed: {initializationError}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              reload page
            </Button>
          </div>
        )}
        
        {/* 主要内容 - 只在初始化完成后显示 */}
        {isInitialized && !initializationError && (
          <>
            {/* 上传区域和设置选项并排显示 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 左侧上传区域 */}
          <div className="md:col-span-2">
            <div 
              ref={dropzoneRef}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer h-full flex flex-col items-center justify-center
                ${isDragging ? 'border-primary bg-primary/10' : 'hover:border-primary'}`}
              onClick={() => document.getElementById('file-upload')?.click()}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                multiple
              />
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">{t('imageConverter.clickOrDragToUpload')}</h3>
              <p className="text-sm text-muted-foreground">
                <Trans 
                  i18nKey="imageConverter.supportedFormats" 
                  values={{ formats: 'JPG, PNG, WebP, JXL, AVIF, HEIC' }}
                  components={{ 
                    span: <span className="text-primary font-medium" /> 
                  }}
                />
                {isDragging && <span className="block text-primary font-medium mt-2">{t('imageConverter.dragMessage')}</span>}
              </p>
            </div>
          </div>
          
          {/* 右侧转换设置 */}
          <div className="md:col-span-1">
            <div className="border rounded-lg p-4 h-full">
              <h3 className="text-lg font-medium mb-4">{t('imageConverter.convertSettings')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">{t('imageConverter.targetFormat')}</label>
                  <Select value={targetFormat} onValueChange={(value: ImageFormat) => setTargetFormat(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('imageConverter.selectFormat')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webp">WebP</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpg">JPG</SelectItem>
                      <SelectItem value="jxl">JXL</SelectItem>
                      {/* <SelectItem value="qoi">QOI</SelectItem> */}
                      <SelectItem value="avif">AVIF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             
              </div>
            </div>
          </div>
        </div>
        
        {/* 转换结果列表 */}
        {conversionResults.length > 0 && (
          <div className="rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-medium">{t('imageConverter.conversionResults')} ({conversionResults.length})</h3>
              </div>
              
              {/* 批量下载按钮 */}
              {conversionResults.some(r => !r.isConverting && r.url) && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleBatchDownload}
                  className="flex items-center"
                >
                  <Archive className="mr-2 h-3.5 w-3.5" /> 
                  {t('imageConverter.downloadAll')}
                </Button>
              )}
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-xs font-medium text-left py-2 px-3">{t('common.image')}</th>
                    <th className="text-xs font-medium text-left py-2 px-3">{t('common.fileInfo')}</th>
                    <th className="text-xs font-medium text-left py-2 px-3">{t('common.conversionInfo')}</th>
                    <th className="text-xs font-medium text-left py-2 px-3">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {conversionResults.map(result => (
                    <tr key={result.id} className="hover:bg-muted/30">
                      <td className="py-2 px-3 w-16">
                        <div className="relative w-12 h-12 bg-muted rounded overflow-hidden flex items-center justify-center">
                          <img 
                            src={result.originalPreview} 
                            alt={t('common.preview')} 
                            className="max-w-full max-h-full object-contain" 
                          />
                          
                          {result.isConverting && (
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
                          
                          {result.isConverting ? (
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                              <div 
                                className="bg-primary h-full transition-all" 
                                style={{ width: `${result.conversionProgress}%` }}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{formatFileSize(result.originalFile.size)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        {result.isConverting ? (
                          <div className="text-xs">{t('imageConverter.converting')}...</div>
                        ) : result.url ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs whitespace-nowrap">{result.originalFormat.toUpperCase()} → {result.targetFormat.toUpperCase()}</span>
                              <span className="text-xs text-muted-foreground mx-1">|</span>
                              <span className="text-xs whitespace-nowrap">{formatFileSize(result.originalFile.size)} → </span>
                              {result.convertedSize !== undefined ? (
                                <>
                                  <span className="text-xs whitespace-nowrap">{formatFileSize(result.convertedSize)}</span>
                                  {result.convertedSize < result.originalFile.size ? (
                                    <span className="text-xs text-green-500 whitespace-nowrap">(-{getConversionRatio(result.originalFile.size, result.convertedSize)})</span>
                                  ) : (
                                    <span className="text-xs text-orange-500 whitespace-nowrap">(+{getConversionRatio(result.convertedSize, result.originalFile.size)})</span>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground">(Calculating...)</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-red-500">
                            {result.error || t('imageConverter.conversionStatus.failed')}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1">
                          {!result.isConverting && result.url && (
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
                            disabled={result.isConverting}
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
          </>
        )}
      </div>
    </ToolLayout>
  );
};

export default ImageConverter; 