import React, { useRef, useState, useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import ToolLayout from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/button';
import { UploadCloud, Download, Trash2 } from 'lucide-react';

// 定义SVG结果类型
interface SVGResult {
  id: string;
  originalFile: File;
  svgPreview: string;
  pngUrl?: string;
  isConverting: boolean;
  timestamp: number;
}

const SVGToPNG = () => {
  const { t } = useTranslation();
  const [svgResults, setSvgResults] = useState<SVGResult[]>([]);
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
    
    // 添加SVG到结果列表
    for (const file of files) {
      // 检查文件类型是否为SVG
      if (file.type !== 'image/svg+xml' && !file.name.toLowerCase().endsWith('.svg')) continue;
      
      const fileId = generateId();
      
      try {
        // 创建预览
        const svgPreview = URL.createObjectURL(file);
        
        // 添加到结果列表
        const newResult: SVGResult = {
          id: fileId,
          originalFile: file,
          svgPreview,
          isConverting: true,
          timestamp: Date.now(),
        };
        
        setSvgResults(prev => [newResult, ...prev]);
        
        // 立即开始转换
        convertSvgToPNG(newResult);
      } catch (error) {
        console.error('处理SVG文件失败:', error);
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
  
  // 将SVG转换为PNG
  const convertSvgToPNG = async (result: SVGResult) => {
    if (!canvasRef.current) return;
    
    try {
      // 加载SVG图片
      const img = new Image();
      img.src = result.svgPreview;
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => reject(e);
      });
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas上下文不可用');
      }
      
      // 设置canvas尺寸与原图一致
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 绘制图像到canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // 转换为PNG
      const pngDataURL = canvas.toDataURL('image/png');
      
      // 更新转换结果
      setSvgResults(prev => 
        prev.map(item => 
          item.id === result.id 
            ? {
                ...item,
                pngUrl: pngDataURL,
                isConverting: false
              }
            : item
        )
      );
      
    } catch (error) {
      console.error('SVG转PNG失败:', error);
      
      // 转换失败，更新状态
      setSvgResults(prev => 
        prev.map(item => 
          item.id === result.id 
            ? { ...item, isConverting: false }
            : item
        )
      );
    }
  };
  
  // 下载PNG
  const handleDownload = (result: SVGResult) => {
    if (!result.pngUrl) return;
    
    const a = document.createElement('a');
    a.href = result.pngUrl;
    
    // 修改文件扩展名
    const originalName = result.originalFile.name;
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
    a.download = `${nameWithoutExt}.png`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  // 删除结果
  const handleDeleteResult = (id: string) => {
    setSvgResults(prev => prev.filter(item => item.id !== id));
  };
  
  // 格式化时间
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  };
  
  return (
    <ToolLayout
      categoryId="svg"
      toolId="svg-to-png"
      title={t('categories.svg.tools.svg-to-png.name')}
      description={`（${t('categories.svg.tools.svg-to-png.description')}）`}
    >
      <div className="space-y-6">
        {/* 隐藏的canvas用于图片处理 */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* 上传区域 */}
        <div
          ref={dropzoneRef}
          onClick={() => document.getElementById('file-upload')?.click()}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer 
            ${isDragging ? 'border-primary bg-primary/10' : 'hover:border-primary'}`}
        >
          <input
            id="file-upload"
            type="file"
            accept=".svg,image/svg+xml"
            className="hidden"
            onChange={handleFileChange}
            multiple
          />
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">{t('svgPreview.clickOrDragToUpload')}</h3>
          <p className="text-sm text-muted-foreground">
            <Trans 
              i18nKey="svgPreview.supportedFormats" 
              values={{ formats: 'SVG' }}
              components={{ 
                span: <span className="text-primary font-medium" /> 
              }}
            />
          </p>
          {isDragging && <span className="block text-primary font-medium mt-2">{t('svgPreview.dragMessage')}</span>}
        </div>
        
        {/* SVG结果列表 */}
        {svgResults.length > 0 && (
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">{t('svgPreview.svgList')} ({svgResults.length})</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {svgResults.map(result => (
                <div key={result.id} className="border rounded-lg p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded p-4 h-40">
                    <img 
                      src={result.pngUrl || result.svgPreview} 
                      alt={result.originalFile.name} 
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm font-medium truncate">
                      {result.originalFile.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(result.originalFile.size)} | {formatTime(result.timestamp)}
                    </div>
                    <div className="text-xs font-medium">
                      {result.isConverting ? (
                        <span className="text-amber-500">{t('svgPreview.converting')}...</span>
                      ) : result.pngUrl ? (
                        <span className="text-green-500">SVG → PNG</span>
                      ) : (
                        <span className="text-red-500">转换失败</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-auto">
                    {!result.isConverting && result.pngUrl && (
                      <Button 
                        onClick={() => handleDownload(result)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="mr-1 h-3.5 w-3.5" />
                        {t('common.download')}
                      </Button>
                    )}
                    
                    <Button 
                      onClick={() => handleDeleteResult(result.id)}
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      disabled={result.isConverting}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      {t('common.delete')}
                    </Button>
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

export default SVGToPNG; 