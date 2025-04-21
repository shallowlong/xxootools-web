import React, { useRef, useState, useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import ToolLayout from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/button';
import { UploadCloud, Download, Trash2 } from 'lucide-react';
import ImageTracer from 'imagetracerjs';

// 定义转换结果类型
interface ConversionResult {
  id: string;
  originalFile: File;
  originalPreview: string;
  svgContent?: string;
  isConverting: boolean;
  timestamp: number;
  error?: string;
}

const PNGToSVG = () => {
  const { t } = useTranslation();
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 生成唯一ID
  const generateId = () => {
    return Math.random().toString(36).substring(2, 9);
  };
  
  // 处理文件选择和上传
  const processFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;
    
    // 添加图片到结果列表
    for (const file of files) {
      // 检查文件类型是否为PNG
      if (!['image/png'].includes(file.type)) continue;
      
      const fileId = generateId();
      
      try {
        // 创建预览
        const imagePreview = URL.createObjectURL(file);
        
        // 添加到结果列表
        const newResult: ConversionResult = {
          id: fileId,
          originalFile: file,
          originalPreview: imagePreview,
          isConverting: true,
          timestamp: Date.now(),
        };
        
        setResults(prev => [newResult, ...prev]);
        
        // 立即开始转换
        convertImageToSVG(newResult);
      } catch (error) {
        console.error('处理图片文件失败:', error);
      }
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
  }, []);
  
  // 将图片转换为SVG
  const convertImageToSVG = async (result: ConversionResult) => {
    try {
      // 创建图像元素
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      // 等待图像加载完成
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(t('image.imageLoadFailed')));
        img.src = result.originalPreview;
      });
      
      // 创建 canvas 上下文
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error(t('image.canvasNotAvailable'));
      }
      
      // 设置 canvas 大小
      const MAX_WIDTH = 800;
      let width = img.width;
      let height = img.height;
      
      if (width > MAX_WIDTH) {
        const ratio = MAX_WIDTH / width;
        width = MAX_WIDTH;
        height = Math.floor(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 绘制图像
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error(t('image.canvasContextError'));
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // 使用 ImageTracer 将图像转换为 SVG
      const options = {
        ltres: 1,           // 线跟踪分辨率
        qtres: 1,           // 量化分辨率
        pathomit: 8,        // 路径粉碎阈值
        colorsampling: 2,   // 颜色采样模式
        numberofcolors: 16, // 颜色数量
        mincolorratio: 0,   // 最小颜色比率
        colorquantcycles: 3,// 颜色量化周期
        blurradius: 0,      // 高斯模糊半径
        blurdelta: 20,      // 高斯模糊增量
        strokewidth: 1,     // 描边宽度
        linefilter: false,  // 线条过滤
        scale: 1,           // 缩放因子
        roundcoords: 1,     // 坐标四舍五入
        viewbox: true,      // 启用视口
        desc: false,        // 添加描述
        lcpr: 0,            // 线条控制点比率
        qcpr: 0,            // 曲线控制点比率
      };
      
      // 将 Canvas 转换为 SVG
      const svg = ImageTracer.imagedataToSVG(
        ctx.getImageData(0, 0, width, height),
        options
      );
      
      // 更新转换结果
      setResults(prev => 
        prev.map(item => 
          item.id === result.id 
            ? {
                ...item,
                svgContent: svg,
                isConverting: false
              }
            : item
        )
      );
    } catch (error) {
      console.error(t('image.svgConversionError'), error);
      
      // 转换失败，更新状态
      setResults(prev => 
        prev.map(item => 
          item.id === result.id 
            ? { 
                ...item, 
                isConverting: false, 
                error: t('image.conversionFailed')
              }
            : item
        )
      );
    }
  };
  
  // 下载SVG
  const handleDownload = (result: ConversionResult) => {
    if (!result.svgContent) return;
    
    const blob = new Blob([result.svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    
    // 修改文件扩展名
    const originalName = result.originalFile.name;
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
    a.download = `${nameWithoutExt}.svg`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // 删除结果
  const handleDeleteResult = (id: string) => {
    setResults(prev => {
      const targetResult = prev.find(item => item.id === id);
      
      // 释放URL资源
      if (targetResult) {
        URL.revokeObjectURL(targetResult.originalPreview);
      }
      
      return prev.filter(item => item.id !== id);
    });
  };
  
  // 格式化时间
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  return (
    <ToolLayout
      categoryId="svg"
      toolId="png-to-svg"
      title={t('categories.svg.tools.png-to-svg.name')}
      description={`（${t('categories.svg.tools.png-to-svg.description')}）`}
    >
      <div className="space-y-4">
        {/* 文件上传区域 */}
        <div
          ref={dropzoneRef}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept="image/png"
            onChange={handleFileChange}
            multiple
          />
          
          <label 
            htmlFor="file-upload" 
            className="cursor-pointer inline-flex flex-col items-center justify-center gap-2"
          >
            <div className="p-3 bg-primary/10 rounded-full">
              <UploadCloud className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium">
              {isDragging ? t('common.dropToUpload') : t('common.clickOrDragToUpload')}
            </h3>
            <p className="text-sm text-muted-foreground">
              <Trans i18nKey="common.supportedFormats" components={{ 
                    span: <span className="text-primary font-medium" /> 
                  }} values={{ formats: 'PNG' }} />
            </p>
          </label>
        </div>

        {/* 隐藏的Canvas用于图像处理 */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* 转换结果列表 */}
        {results.length > 0 && (
          <div className="border rounded-lg overflow-hidden mt-6">
            <div className="bg-muted/50 p-3 font-medium">
              {t('image.conversionResults')} ({results.length})
            </div>
            
            <div className="divide-y">
              {results.map(result => (
                <div key={result.id} className="p-4">
                  <div className="grid grid-cols-[auto,1fr,1fr,auto] items-center gap-4">
                    {/* 预览图 */}
                    <div className="flex-shrink-0 w-16 h-16 bg-muted/30 rounded overflow-hidden flex items-center justify-center">
                      <img
                        src={result.originalPreview}
                        alt={result.originalFile.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    
                    {/* 文件信息 */}
                    <div className="min-w-0">
                      <h3 className="font-medium truncate text-sm sm:text-base">{result.originalFile.name}</h3>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                        <div>{formatFileSize(result.originalFile.size)}</div>
                        <div className="text-gray-400">{formatTime(result.timestamp)}</div>
                      </div>
                    </div>
                    
                    {/* 转换信息 */}
                    <div>
                      {result.svgContent && !result.isConverting && !result.error ? (
                        <div className="text-sm">
                          <div className="flex items-center gap-2">
                            <span>{result.originalFile.type.split('/')[1].toUpperCase()} → SVG</span>
                            <span>|</span>
                            <span>
                              {formatFileSize(result.originalFile.size)} →{' '}
                              {formatFileSize(new Blob([result.svgContent]).size)}
                              {' '}
                              <span className="text-green-500">
                                ({((new Blob([result.svgContent]).size - result.originalFile.size) / result.originalFile.size * 100).toFixed(1)}%)
                              </span>
                            </span>
                          </div>
                        </div>
                      ) : result.isConverting ? (
                        <div className="text-sm text-muted-foreground">{t('image.converting')}</div>
                      ) : result.error ? (
                        <div className="text-sm text-destructive">{t('image.conversionFailed')}</div>
                      ) : null}
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2">
                      {/* 下载按钮 */}
                      {!result.isConverting && !result.error && result.svgContent && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(result)}
                          title={t('common.download')}
                          className="h-8 w-8 sm:h-9 sm:w-9"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {/* 删除按钮 */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 sm:h-9 sm:w-9 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteResult(result.id)}
                        title={t('common.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default PNGToSVG; 