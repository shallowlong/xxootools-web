import React, { useRef, useState, useCallback } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/button';
import { UploadCloud, Download, RefreshCw, Trash2, Archive, Lock, Unlock } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useTranslation, Trans } from 'react-i18next';

// 定义调整尺寸模式类型
type ResizeMode = 'pixel' | 'percent';

// 定义调整尺寸结果类型
interface ResizeResult {
  id: string;
  originalFile: File;
  originalPreview: string;
  originalWidth: number;
  originalHeight: number;
  url: string;
  width: number;
  height: number;
  timestamp: number;
  isResizing: boolean;  // 是否正在调整尺寸中
  resizeProgress: number; // 调整尺寸进度
  fileType: string; // 文件类型
}

const ImageResize = () => {
  const { t } = useTranslation();
  const [resizeMode, setResizeMode] = useState<ResizeMode>('pixel');
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [percentage, setPercentage] = useState(100);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resizeResults, setResizeResults] = useState<ResizeResult[]>([]);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState(0);
  
  // 处理文件选择和上传
  const processFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;
    
    // 添加图片到调整尺寸结果列表，但设置为未处理状态
    for (const file of files) {
      // 检查文件类型是否为图片
      if (!file.type.startsWith('image/')) continue;
      
      const fileId = generateId();
      
      try {
        // 创建预览
        const previewUrl = await createImagePreview(file);
        
        // 获取原始图片尺寸
        const dimensions = await getImageDimensions(previewUrl);
        
        // 设置初始宽高
        if (reprocessingId === null) {
          setWidth(dimensions.width);
          setHeight(dimensions.height);
          setAspectRatio(dimensions.width / dimensions.height);
        }
        
        // 添加到结果列表，但不立即调整尺寸
        const newResult: ResizeResult = {
          id: fileId,
          originalFile: file,
          originalPreview: previewUrl,
          originalWidth: dimensions.width,
          originalHeight: dimensions.height,
          url: '',  // 尚未调整尺寸，URL为空
          width: 0,  // 尚未调整尺寸，宽度为0
          height: 0, // 尚未调整尺寸，高度为0
          timestamp: Date.now(),
          isResizing: false,  // 上传后不立即调整
          resizeProgress: 0,
          fileType: file.type
        };
        
        setResizeResults(prev => [newResult, ...prev]);
        
        // 不再立即调整尺寸
        // resizeImage(newResult);
      } catch (error) {
        console.error(t('imageResize.errors.processingError'), error);
      }
    }
  };
  
  // 处理宽度变化，如果保持纵横比，则自动调整高度
  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    if (keepAspectRatio && aspectRatio > 0) {
      setHeight(Math.round(newWidth / aspectRatio));
    }
  };
  
  // 处理高度变化，如果保持纵横比，则自动调整宽度
  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    if (keepAspectRatio && aspectRatio > 0) {
      setWidth(Math.round(newHeight * aspectRatio));
    }
  };
  
  // 处理百分比变化
  const handlePercentageChange = (newPercentage: number) => {
    setPercentage(newPercentage);
  };
  
  // 获取图片尺寸
  const getImageDimensions = (url: string): Promise<{width: number, height: number}> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = (e) => {
        reject(e);
      };
      img.src = url;
    });
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
  
  // 调整图片尺寸
  const resizeImage = async (result: ResizeResult) => {
    if (!canvasRef.current) return;
    
    try {
      // 加载图片
      const img = new Image();
      img.src = result.originalPreview;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });
      
      // 计算新的尺寸
      let newWidth, newHeight;
      
      if (resizeMode === 'pixel') {
        newWidth = width;
        newHeight = height;
      } else {
        // 百分比模式
        newWidth = Math.round(result.originalWidth * (percentage / 100));
        newHeight = Math.round(result.originalHeight * (percentage / 100));
      }
      
      // 特殊处理SVG
      if (result.fileType === 'image/svg+xml') {
        // SVG不需要使用canvas绘制，直接返回原始数据，但记录新尺寸
        updateResizeProgress(result.id, 100);
        
        setResizeResults(prev => 
          prev.map(item => 
            item.id === result.id 
              ? {
                  ...item,
                  url: result.originalPreview,
                  width: newWidth,
                  height: newHeight,
                  isResizing: false,
                  resizeProgress: 100
                }
              : item
          )
        );
        
        if (reprocessingId === result.id) {
          setReprocessingId(null);
        }
        
        return;
      }
      
      // 处理GIF（简单实现，实际上GIF需要特殊处理才能保留动画）
      if (result.fileType === 'image/gif') {
        // 这里简化处理，实际上会丢失动画
        updateResizeProgress(result.id, 50);
      }
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error(t('imageResize.errors.canvasContextNotAvailable'));
        return;
      }
      
      // 设置canvas尺寸为调整后的尺寸
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // 绘制图像到canvas，调整尺寸
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // 更新进度为50%（表示图像已加载和绘制）
      updateResizeProgress(result.id, 50);
      
      // 根据原始格式获取调整后的图像数据
      let resizedDataURL: string;
      
      if (result.fileType === 'image/png') {
        resizedDataURL = canvas.toDataURL('image/png');
      } else if (result.fileType === 'image/jpeg' || result.fileType === 'image/jpg') {
        resizedDataURL = canvas.toDataURL('image/jpeg', 0.95);
      } else if (result.fileType === 'image/webp') {
        resizedDataURL = canvas.toDataURL('image/webp', 0.95);
      } else {
        // 默认使用PNG格式
        resizedDataURL = canvas.toDataURL('image/png');
      }
      
      // 更新进度为90%（表示调整尺寸完成）
      updateResizeProgress(result.id, 90);
      
      // 延迟更新，让进度条动画更平滑
      setTimeout(() => {
        setResizeResults(prev => 
          prev.map(item => 
            item.id === result.id 
              ? {
                  ...item,
                  url: resizedDataURL,
                  width: newWidth,
                  height: newHeight,
                  isResizing: false,
                  resizeProgress: 100
                }
              : item
          )
        );
        
        if (reprocessingId === result.id) {
          setReprocessingId(null);
        }
      }, 500);
      
    } catch (error) {
      console.error(t('imageResize.errors.resizingError'), error);
      
      // 调整尺寸失败，更新状态
      setResizeResults(prev => 
        prev.map(item => 
          item.id === result.id 
            ? { ...item, isResizing: false }
            : item
        )
      );
      
      if (reprocessingId === result.id) {
        setReprocessingId(null);
      }
    }
  };
  
  // 更新调整尺寸进度
  const updateResizeProgress = (id: string, progress: number) => {
    setResizeResults(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, resizeProgress: progress }
          : item
      )
    );
  };
  
  // 重新调整图片尺寸
  const handleResize = (result: ResizeResult) => {
    if (result.isResizing) return;
    
    // 设置为正在处理状态
    setResizeResults(prev => 
      prev.map(item => 
        item.id === result.id 
          ? { ...item, isResizing: true, resizeProgress: 0 }
          : item
      )
    );
    
    setReprocessingId(result.id);
    resizeImage(result);
  };
  
  // 生成唯一ID
  const generateId = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };
  
  // 下载调整尺寸后的图片
  const handleDownload = (result: ResizeResult) => {
    if (result.isResizing || !result.url) return;
    
    const a = document.createElement('a');
    a.href = result.url;
    
    // 设置文件名
    let fileName = result.originalFile.name || 'resized-image';
    const dotIndex = fileName.lastIndexOf('.');
    let extension = '';
    if (dotIndex > 0) {
      extension = fileName.substring(dotIndex);
      fileName = fileName.substring(0, dotIndex);
    }
    
    a.download = `${fileName}-${result.width}x${result.height}${extension}`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  // 下载所有调整尺寸后的图片到zip文件
  const handleDownloadAll = async () => {
    const completedResults = resizeResults.filter(r => !r.isResizing && r.url);
    if (completedResults.length === 0) return;
    
    try {
      setIsProcessing(true); // 使用加载状态
      
      // 创建一个新的zip文件
      const zip = new JSZip();
      
      // 为每个调整尺寸结果添加文件到zip
      for (let i = 0; i < completedResults.length; i++) {
        const result = completedResults[i];
        
        // 设置文件名
        let fileName = result.originalFile.name || 'resized-image';
        const dotIndex = fileName.lastIndexOf('.');
        let extension = '';
        if (dotIndex > 0) {
          extension = fileName.substring(dotIndex);
          fileName = fileName.substring(0, dotIndex);
        }
        fileName = `${fileName}-${result.width}x${result.height}${extension}`;
        
        // 从dataURL提取base64数据
        const base64Data = result.url.split(',')[1];
        
        // 添加文件到zip
        zip.file(fileName, base64Data, { base64: true });
        
        // 更新进度
        const progressPercent = Math.round(((i + 1) / completedResults.length) * 100);
        updateResizeProgress('zip-progress', progressPercent);
      }
      
      // 生成zip文件
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      }, (metadata) => {
        // 更新压缩进度
        updateResizeProgress('zip-progress', metadata.percent | 0);
      });
      
      // 下载zip文件
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      saveAs(zipBlob, `resized-images-${timestamp}.zip`);
    } catch (error) {
      console.error(t('imageResize.errors.createZipError'), error);
      alert(t('imageResize.errors.downloadFailed'));
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 删除调整尺寸结果
  const handleDeleteResult = (id: string) => {
    setResizeResults(prev => prev.filter(result => result.id !== id));
  };
  
  // 格式化时间
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  // 添加应用尺寸的函数
  const applyResizeSettings = () => {
    const unprocessedResults = resizeResults.filter(r => !r.isResizing && !r.url);
    if (unprocessedResults.length === 0) return;
    
    // 对所有未处理的图片应用当前尺寸设置
    for (const result of unprocessedResults) {
      // 设置为正在处理状态
      setResizeResults(prev => 
        prev.map(item => 
          item.id === result.id 
            ? { ...item, isResizing: true, resizeProgress: 0 }
            : item
        )
      );
      
      // 开始调整尺寸
      resizeImage(result);
    }
  };
  
  return (
    <ToolLayout
      categoryId="image"
      toolId="image-resize"
      title={t('imageResize.title')}
      description={`（${t('imageResize.description')}）`}
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
              accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml,image/gif"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <UploadCloud className={`mx-auto h-12 w-12 ${isDragging ? 'text-primary' : 'text-muted-foreground'} mb-4`} />
            <h3 className="text-lg font-medium mb-1">
              {isDragging 
                ? t('imageResize.dropToUpload')
                : t('imageResize.clickOrDragToUpload')}
            </h3>
            <p className="text-sm text-muted-foreground">
              <Trans 
                i18nKey="imageResize.supportedFormats" 
                values={{ formats: 'JPG, PNG, SVG, GIF, WebP' }}
                components={{ 
                  span: <span className="text-primary font-medium" /> 
                }}
              />
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">{t('imageResize.resizeOptions')}</h3>
            
            <div className="space-y-4">
              <Tabs value={resizeMode} onValueChange={(value) => setResizeMode(value as ResizeMode)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pixel">{t('imageResize.byPixels')}</TabsTrigger>
                  <TabsTrigger value="percent">{t('imageResize.byPercentage')}</TabsTrigger>
                </TabsList>
                <TabsContent value="pixel" className="space-y-3 pt-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">{t('imageResize.width')} (px)</label>
                      <Input 
                        value={width}
                        onChange={(e) => handleWidthChange(parseInt(e.target.value) || width)}
                        className="w-20 h-8"
                        type="number"
                        min="1"
                        max="10000"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">{t('imageResize.height')} (px)</label>
                      <Input 
                        value={height}
                        onChange={(e) => handleHeightChange(parseInt(e.target.value) || height)}
                        className="w-20 h-8"
                        type="number"
                        min="1"
                        max="10000"
                      />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="percent" className="space-y-3 pt-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">{t('imageResize.percentage')}</label>
                      <div className="flex items-center space-x-2">
                        <Input 
                          value={percentage}
                          onChange={(e) => handlePercentageChange(parseInt(e.target.value) || percentage)}
                          className="w-16 h-8"
                          type="number"
                          min="1"
                          max="1000"
                        />
                        <span>%</span>
                      </div>
                    </div>
                    <Slider
                      value={[percentage]}
                      min={1}
                      max={200}
                      step={1}
                      onValueChange={(value: number[]) => setPercentage(value[0])}
                      className="my-2"
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="keep-ratio"
                  checked={keepAspectRatio}
                  onCheckedChange={(checked) => setKeepAspectRatio(checked as boolean)}
                />
                <label
                  htmlFor="keep-ratio"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {keepAspectRatio ? <Lock className="h-3.5 w-3.5 inline mr-1" /> : <Unlock className="h-3.5 w-3.5 inline mr-1" />}
                  {t('imageResize.maintainAspectRatio')}
                </label>
              </div>
              
              {/* 添加应用尺寸按钮 */}
              <div className="pt-4">
                <Button 
                  onClick={applyResizeSettings}
                  className="w-full"
                  disabled={resizeResults.filter(r => !r.isResizing && !r.url).length === 0}
                >
                  {t('imageResize.applySettings')}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* 显示待处理图片列表 */}
        {resizeResults.filter(r => !r.isResizing && !r.url).length > 0 && (
          <div className="rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">{t('imageResize.pendingImages')} ({resizeResults.filter(r => !r.isResizing && !r.url).length})</h3>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-xs font-medium text-left py-2 px-3">{t('imageResize.image')}</th>
                    <th className="text-xs font-medium text-left py-2 px-3">{t('imageResize.fileInfo')}</th>
                    <th className="text-xs font-medium text-left py-2 px-3">{t('imageResize.dimensions')}</th>
                    <th className="text-xs font-medium text-left py-2 px-3">{t('imageResize.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {resizeResults
                    .filter(result => !result.isResizing && !result.url)
                    .map((result) => (
                      <tr key={result.id} className="hover:bg-muted/30">
                        <td className="py-2 px-3 w-16">
                          <div className="relative w-16 h-16 bg-muted rounded overflow-hidden flex items-center justify-center">
                            <img 
                              src={result.originalPreview} 
                              alt={t('imageResize.preview')} 
                              className="max-w-full max-h-full object-contain" 
                            />
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium truncate max-w-[150px]">{result.originalFile.name}</span>
                              <span className="text-xs text-muted-foreground">{formatTime(result.timestamp)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{result.fileType.split('/')[1].toUpperCase()}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs whitespace-nowrap">{t('imageResize.original')}: {result.originalWidth}×{result.originalHeight}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex gap-1">
                            <Button 
                              onClick={() => handleDeleteResult(result.id)}
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
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

        {/* 显示调整历史记录 */}
        {resizeResults.filter(r => r.isResizing || r.url).length > 0 && (
          <div className="rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">{t('imageResize.resizeHistory')} ({resizeResults.filter(r => r.isResizing || r.url).length})</h3>
              {resizeResults.filter(r => !r.isResizing && r.url).length > 0 && (
                <Button
                  onClick={handleDownloadAll}
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                >
                  <Archive className="mr-2 h-3.5 w-3.5" />
                  {t('imageResize.downloadAll')}
                </Button>
              )}
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-xs font-medium text-left py-2 px-3">{t('imageResize.image')}</th>
                    <th className="text-xs font-medium text-left py-2 px-3">{t('imageResize.fileInfo')}</th>
                    <th className="text-xs font-medium text-left py-2 px-3">{t('imageResize.dimensions')}</th>
                    <th className="text-xs font-medium text-left py-2 px-3">{t('imageResize.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {resizeResults
                    .filter(result => result.isResizing || result.url)
                    .map((result) => (
                      <tr key={result.id} className="hover:bg-muted/30">
                        <td className="py-2 px-3 w-16">
                          <div className="relative w-16 h-16 bg-muted rounded overflow-hidden flex items-center justify-center">
                            <img 
                              src={result.isResizing ? result.originalPreview : result.url || result.originalPreview} 
                              alt={t('imageResize.preview')} 
                              className="max-w-full max-h-full object-contain" 
                            />
                            
                            {result.isResizing && (
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
                            
                            {result.isResizing ? (
                              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                                <div 
                                  className="bg-primary h-full transition-all" 
                                  style={{ width: `${result.resizeProgress}%` }}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{result.fileType.split('/')[1].toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          {result.isResizing ? (
                            <div className="text-xs">{t('imageResize.resizing')}...</div>
                          ) : result.url ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs whitespace-nowrap">{t('imageResize.original')}: {result.originalWidth}×{result.originalHeight}</span>
                              <span className="text-xs whitespace-nowrap">→</span>
                              <span className="text-xs whitespace-nowrap">{t('imageResize.resized')}: {result.width}×{result.height}</span>
                            </div>
                          ) : (
                            <div className="text-xs text-red-500">{t('imageResize.resizingFailed')}</div>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex gap-1">
                            {!result.isResizing && result.url && (
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
                              disabled={result.isResizing}
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

export default ImageResize; 