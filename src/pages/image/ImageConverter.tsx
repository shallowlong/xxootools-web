import React, { useRef, useState, useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import ToolLayout from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/button';
import { UploadCloud, Download, Trash2, Archive } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// 定义转换格式类型
type ImageFormat = 'webp' | 'png' | 'jpg' | 'gif';

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
}

const ImageConverter = () => {
  const { t } = useTranslation();
  const [targetFormat, setTargetFormat] = useState<ImageFormat>('webp');
  const [conversionResults, setConversionResults] = useState<ConversionResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
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
  
  // 转换单张图片
  const convertImage = async (result: ConversionResult) => {
    if (!canvasRef.current) return;
    
    try {
      // 加载图片
      const img = new Image();
      img.src = result.originalPreview;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });
      
      updateConversionProgress(result.id, 40);
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error(t('imageConverter.errors.canvasContextNotAvailable'));
        return;
      }
      
      // 设置canvas尺寸与原图一致
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 绘制图像到canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      updateConversionProgress(result.id, 70);
      
      // 根据选择的格式进行转换
      const targetMimeType = `image/${result.targetFormat === 'jpg' ? 'jpeg' : result.targetFormat}`;
      
      const convertedDataURL: string = canvas.toDataURL(targetMimeType, 1.0);
      
      updateConversionProgress(result.id, 90);
      
      // 更新转换结果
      setTimeout(() => {
        setConversionResults(prev => 
          prev.map(item => 
            item.id === result.id 
              ? {
                  ...item,
                  url: convertedDataURL,
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
            ? { ...item, isConverting: false }
            : item
        )
      );
    }
  };
  
  // 下载转换后的图片
  const handleDownload = (result: ConversionResult) => {
    if (!result.url) return;
    
    const a = document.createElement('a');
    a.href = result.url;
    
    // 修改文件扩展名
    const originalName = result.originalFile.name;
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
    a.download = `${nameWithoutExt}.${result.targetFormat}`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  // 批量下载所有转换后的图片
  const handleBatchDownload = async () => {
    // 获取所有已完成转换的结果
    const completedResults = conversionResults.filter(result => !result.isConverting && result.url);
    
    if (completedResults.length === 0) return;
    
    const zip = new JSZip();
    
    // 添加每个图片到zip
    completedResults.forEach(result => {
      // 从Data URL中提取base64数据
      const base64Data = result.url.split(',')[1];
      
      // 获取文件名
      const originalName = result.originalFile.name;
      const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
      const fileName = `${nameWithoutExt}.${result.targetFormat}`;
      
      // 添加到zip
      zip.file(fileName, base64Data, { base64: true });
    });
    
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
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };
  
  return (
    <ToolLayout
      title={t('imageConverter.title')}
      description={`（${t('imageConverter.description')}）`}
    >
      <div>
        {/* 隐藏的canvas用于图片处理 */}
        <canvas ref={canvasRef} className="hidden" />
        
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
                  values={{ formats: 'JPG, PNG, WebP, GIF' }}
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
                      <SelectItem value="gif">GIF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 转换结果列表 */}
        {conversionResults.length > 0 && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">{t('imageConverter.conversionResults')}</h3>
              
              {/* 批量下载按钮 */}
              {conversionResults.some(r => !r.isConverting && r.url) && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleBatchDownload}
                  className="flex items-center"
                >
                  <Archive className="mr-2 h-4 w-4" /> 
                  {t('imageConverter.downloadAll')}
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              {conversionResults.map(result => (
                <div key={result.id} className="border rounded-lg p-3 flex flex-col md:flex-row">
                  {/* 左侧：文件信息和状态 */}
                  <div className="flex-grow mb-3 md:mb-0 md:mr-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-muted rounded-md overflow-hidden flex items-center justify-center shrink-0">
                        <img 
                          src={result.originalPreview} 
                          alt={t('common.preview')} 
                          className="max-w-full max-h-full object-contain" 
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{result.originalFile.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center mt-0.5">
                          <span className="inline-flex items-center">
                            {result.originalFormat.toUpperCase()} → {result.targetFormat.toUpperCase()}
                          </span>
                          <span className="mx-2">•</span>
                          <span>{formatTime(result.timestamp)}</span>
                        </p>
                      </div>
                    </div>
                    
                    {/* 转换状态/进度 */}
                    {result.isConverting ? (
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${result.conversionProgress}%` }}
                        />
                      </div>
                    ) : result.url ? (
                      <div className="flex items-center text-xs text-green-600 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {t('imageConverter.conversionStatus.success')}
                      </div>
                    ) : (
                      <div className="flex items-center text-xs text-red-500 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {t('imageConverter.conversionStatus.failed')}
                      </div>
                    )}
                  </div>
                  
                  {/* 右侧：操作按钮 */}
                  {!result.isConverting && result.url && (
                    <div className="flex items-center space-x-2 shrink-0">
                       <Button 
                        onClick={() => handleDownload(result)}
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                     
                      <Button 
                        onClick={() => handleDeleteResult(result.id)}
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

export default ImageConverter; 