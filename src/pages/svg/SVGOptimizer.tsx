import React, { useRef, useState, useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import ToolLayout from '@/components/tool/ToolLayout';
import { UploadCloud, Download, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Editor from '@monaco-editor/react';
import { optimize } from 'svgo';

const SVGOptimizer = () => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [svgCode, setSvgCode] = useState<string>('');
  const [optimizedSvgCode, setOptimizedSvgCode] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [optimizedSize, setOptimizedSize] = useState<number>(0);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  
  // 处理文件上传
  const handleFile = useCallback(async (file: File) => {
    if (file && file.type === 'image/svg+xml') {
      setFileName(file.name.replace(/\.svg$/i, ''));
      
      // 读取文件内容并预览
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setSvgCode(content);
        setOriginalSize(new Blob([content]).size);
        setOptimizedSvgCode(null);
        setOptimizedSize(0);
      };
      reader.readAsText(file);
    }
  }, []);
  
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
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);
  
  // Handle editor changes
  const handleEditorChange = (value: string | undefined) => {
    const newValue = value || '';
    setSvgCode(newValue);
    setOriginalSize(new Blob([newValue]).size);
    setOptimizedSvgCode(null);
    setOptimizedSize(0);
  };
  
  // Optimize SVG
  const optimizeSvg = useCallback(async () => {
    if (!svgCode) return;
    
    setIsOptimizing(true);
    try {
      const result = optimize(svgCode, {
        // SVGO optimization options
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                removeViewBox: false,
              },
            },
          },
          'removeXMLProcInst',
          'removeComments',
          'removeMetadata',
          'removeEditorsNSData',
          'cleanupAttrs',
          'mergeStyles',
          'inlineStyles',
          'minifyStyles',
          'cleanupIds',
          'removeRasterImages',
          'removeUselessDefs',
          'convertColors',
          'removeUnknownsAndDefaults',
          'removeNonInheritableGroupAttrs',
          'removeUselessStrokeAndFill',
          'cleanupEnableBackground',
          'removeHiddenElems',
          'removeEmptyText',
          'removeEmptyAttrs',
          'removeEmptyContainers',
          'mergePaths',
          'convertPathData',
          'convertTransform',
          'removeUnusedNS',
          'sortAttrs',
          'sortDefsChildren',
          'removeTitle',
          'removeDesc',
        ]
      });
      
      const optimized = result.data;
      setOptimizedSvgCode(optimized);
      setOptimizedSize(new Blob([optimized]).size);
    } catch (error) {
      console.error('SVG optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [svgCode]);
  
  // Download optimized SVG
  const downloadSVG = useCallback(() => {
    if (!optimizedSvgCode || !fileName) return;
    
    const blob = new Blob([optimizedSvgCode], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}-optimized.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [optimizedSvgCode, fileName]);
  
  // Calculate file size reduction percentage
  const calculateSavings = useCallback(() => {
    if (originalSize === 0 || optimizedSize === 0) return '0%';
    const reduction = originalSize - optimizedSize;
    const percentage = Math.round((reduction / originalSize) * 100);
    return `${percentage}%`;
  }, [originalSize, optimizedSize]);
  
  // 重置
  const resetForm = useCallback(() => {
    setSvgCode('');
    setOptimizedSvgCode(null);
    setFileName('');
    setOriginalSize(0);
    setOptimizedSize(0);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }, []);
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <ToolLayout
      categoryId="svg"
      toolId="svg-optimizer"
      title={t('categories.svg.tools.svg-optimizer.name')}
      description={`（${t('categories.svg.tools.svg-optimizer.description')}）`}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <h3 className="text-lg font-medium">
            {fileName ? `${fileName}.svg` : t('svgOptimizer.uploadOrPaste')}
          </h3>
          <div className="flex gap-2">
            {svgCode && (
              <Button variant="outline" size="sm" onClick={resetForm}>
                 <X className="h-4 w-4 mr-2" />
                {t('svgOptimizer.reset')}
              </Button>
            )}
            <Button
              onClick={optimizeSvg}
              disabled={isOptimizing || !svgCode}
              size="sm"
            >
              {isOptimizing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {t('svgOptimizer.optimizeSVG')}
            </Button>
             {optimizedSvgCode && (
               <Button
                 onClick={downloadSVG}
                 disabled={!optimizedSvgCode}
                 size="sm"
               >
                 <Download className="h-4 w-4 mr-2" />
                 {t('svgOptimizer.downloadSVG')}
               </Button>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {!svgCode ? (
              <div
                ref={dropzoneRef}
                onClick={() => document.getElementById('file-upload')?.click()}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer h-96 flex flex-col justify-center items-center
                  ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'}`}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept=".svg,image/svg+xml"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">{t('svgOptimizer.clickOrDragToUpload')}</h3>
                <p className="text-sm text-muted-foreground">
                  <Trans
                    i18nKey="svgOptimizer.supportedFormats"
                    values={{ formats: 'SVG' }}
                    components={{ span: <span className="text-primary font-medium" /> }}
                  />
                </p>
                {isDragging && <span className="block text-primary font-medium mt-2">{t('svgOptimizer.dragMessage')}</span>}
              </div>
            ) : (
              <div>
                <h4 className="text-sm font-medium mb-2">{t('svgOptimizer.original')}</h4>
                <div className="border rounded-lg overflow-hidden h-96">
                   <Editor
                    height="100%"
                    language="xml"
                    value={svgCode}
                    onChange={handleEditorChange}
                    options={{ minimap: { enabled: false }, scrollBeyondLastLine: false }}
                   />
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {formatFileSize(originalSize)}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            { svgCode && <h4 className="text-sm font-medium mb-2">{t('svgOptimizer.optimized')}</h4>}
            <div className="border rounded-lg overflow-hidden h-96">
              {optimizedSvgCode ? (
                <Editor
                  height="100%"
                  language="xml"
                  value={optimizedSvgCode}
                  options={{ 
                    minimap: { enabled: false }, 
                    scrollBeyondLastLine: false,
                    readOnly: true
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  {svgCode ? t('svgOptimizer.processing') : ''}
                </div>
              )}
            </div>
            {optimizedSize > 0 && (
              <div className="text-sm text-muted-foreground mt-2 flex justify-between">
                <span>{formatFileSize(optimizedSize)}</span>
                <span className="text-green-600 font-medium">
                  {t('svgOptimizer.savings')}: {calculateSavings()}
                </span>
              </div>
            )}
          </div>
        </div>

        {optimizedSvgCode && (
          <div className="space-y-4 pt-6 border-t mt-6">
            <h4 className="text-md font-medium">{t('svgOptimizer.original')} vs {t('svgOptimizer.optimized')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 overflow-auto h-[300px] flex justify-center items-center">
                <div dangerouslySetInnerHTML={{ __html: svgCode }} className="w-full h-full" />
              </div>
              <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 overflow-auto h-[300px] flex justify-center items-center">
                <div dangerouslySetInnerHTML={{ __html: optimizedSvgCode }} className="w-full h-full" />
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default SVGOptimizer; 