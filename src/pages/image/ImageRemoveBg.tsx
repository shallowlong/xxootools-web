'use client';

import React, { useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import ToolLayout from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/button';
import { UploadCloud, Download, Trash2, Archive, RefreshCw } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// 类型定义
interface ProcessingResult {
  id: string;
  originalUrl: string;
  processedUrl: string | undefined;
  status: 'processing' | 'completed' | 'failed';
  error?: string;
  processingProgress: number;
  processingTime?: number;
}

// 添加棋盘格背景样式
const checkerboardStyle = {
  backgroundImage: `linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
  backgroundColor: 'white'
};

// 创建BG Remover组件
const ImageRemoveBg = () => {
  const { t } = useTranslation();
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  // 引用
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 处理上传的文件
  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;
    
    // 如果已经在导入库，不要重复操作
    if (isImporting) {
      setErrorMessage('正在加载处理库，请稍后重试');
      return;
    }

    const newResults: ProcessingResult[] = [];
    // 创建文件映射，关联ID和文件
    const fileMap = new Map<string, File>();

    for (const file of files) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        setErrorMessage(`不支持的文件类型: ${file.type}`);
        continue;
      }

      // 创建预览
      const originalUrl = await createImagePreview(file);
      const id = generateId();
      
      // 存储文件引用
      fileMap.set(id, file);
      
      const result: ProcessingResult = {
        id,
        originalUrl,
        processedUrl: undefined,
        status: 'processing',
        processingProgress: 0
      };

      newResults.push(result);
    }

    setProcessingResults(prev => [...prev, ...newResults]);

    // 处理每个图片
    for (const result of newResults) {
      try {
        // 直接从映射中获取文件
        const file = fileMap.get(result.id);
        await processImage(result, file);
      } catch (error) {
        console.error('处理图片失败:', error);
        setProcessingResults(prev =>
          prev.map(item =>
            item.id === result.id
              ? { ...item, status: 'failed', error: String(error) }
              : item
          )
        );
      }
    }
  };
  
  // 处理单个图片
  const processImage = async (result: ProcessingResult, file?: File) => {
    try {
      if (!file) {
        throw new Error('未找到原始文件');
      }
      
      // 更新状态为处理中
      setProcessingResults(prev =>
        prev.map(item =>
          item.id === result.id
            ? { ...item, status: 'processing', processingProgress: 10 }
            : item
        )
      );

      // 记录开始时间
      const startTime = performance.now();
      
      // 懒加载 background-removal 库，避免初始加载问题
      setIsImporting(true);
      let removeBackground;
      try {
        removeBackground = (await import('@imgly/background-removal')).removeBackground;
        if (!removeBackground) {
          throw new Error('背景移除功能未能正确加载');
        }
      } catch (error) {
        console.error('导入背景移除库失败:', error);
        throw new Error('加载背景移除功能失败，请检查网络连接');
      } finally {
        setIsImporting(false);
      }
      
      // 更新进度到20%
      setProcessingResults(prev =>
        prev.map(item =>
          item.id === result.id
            ? { ...item, processingProgress: 20 }
            : item
        )
      );
      
      // 确保我们设置了进度更新函数
      const handleProgress = (progress: number) => {
        const adjustedProgress = 20 + Math.round(progress * 80);
        setProcessingResults(prev =>
          prev.map(item =>
            item.id === result.id
              ? { ...item, processingProgress: adjustedProgress }
              : item
          )
        );
      };
      
      // 调用移除背景函数
      const processedBlob = await removeBackground(file, {
        progress: (_key: string, current: number, total: number) => {
          if (total > 0) {
            handleProgress(current / total);
          }
        },
        rescale: true,
        device: 'gpu',
        output: {
          quality: 0.8,
          format: 'image/png'
        },
        // model: 'isnet_quint8' // 使用量化模型以提高性能
      });

      // 计算处理时间
      const processingTime = (performance.now() - startTime) / 1000;

      // 创建处理后的图片 URL
      const processedUrl = URL.createObjectURL(processedBlob);

      // 更新结果
      setProcessingResults(prev =>
        prev.map(item =>
          item.id === result.id
            ? { 
                ...item, 
                processedUrl, 
                status: 'completed', 
                processingProgress: 100,
                processingTime
              }
            : item
        )
      );
    } catch (error) {
      console.error('处理图片错误:', error);
      setProcessingResults(prev =>
        prev.map(item =>
          item.id === result.id
            ? { ...item, status: 'failed', error: String(error) }
            : item
        )
      );
    }
  };

  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // 创建图片预览
  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  // 处理文件选择
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
      e.target.value = ''; // 重置文件输入，允许重复上传相同文件
    }
  };

  // 拖放处理
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setErrorMessage(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  // 下载处理后的图片
  const handleDownload = (result: ProcessingResult) => {
    if (result.processedUrl) {
      const link = document.createElement('a');
      link.href = result.processedUrl;
      link.download = `bg-removed-${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // 批量下载所有处理完成的图片
  const handleBatchDownload = async () => {
    const completedResults = processingResults.filter(
      (result) => result.status === 'completed' && result.processedUrl
    );

    if (completedResults.length === 0) {
      return;
    }

    if (completedResults.length === 1) {
      handleDownload(completedResults[0]);
      return;
    }

    const zip = new JSZip();
    const folder = zip.folder('background-removed');

    if (!folder) return;

    for (let i = 0; i < completedResults.length; i++) {
      const result = completedResults[i];
      if (result.processedUrl) {
        try {
          const blob = await fetch(result.processedUrl).then((r) => r.blob());
          folder.file(`bg-removed-${i + 1}.png`, blob);
        } catch (error) {
          console.error('添加文件到ZIP时出错:', error);
        }
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `background-removed-${new Date().getTime()}.zip`);
  };

  // 删除结果
  const handleDeleteResult = (id: string) => {
    setProcessingResults((prev) => prev.filter((result) => result.id !== id));
  };

  // 格式化时间
  const formatTime = (): string => {
    return new Date().toLocaleTimeString();
  };

  // 格式化处理时间
  const formatProcessingTime = (seconds?: number): string => {
    if (seconds === undefined) return '-';
    return `${seconds.toFixed(1)}秒`;
  };

  // 触发文件选择对话框
  const handleSelectFiles = () => {
    fileInputRef.current?.click();
  };

  return (
    <ToolLayout
      title={t('imageRemoveBg.title')}
      description={`（${t('imageRemoveBg.description')}）`}
      categoryId="image"
      toolId="removebg"
    >
      <div className="mb-4">
        <div
          ref={dropzoneRef}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 dark:border-gray-700 hover:border-primary/50'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleSelectFiles}
        >
          <div className="flex justify-center">
            <UploadCloud className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium">
            {t('imageRemoveBg.dropzone.title')}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            <Trans 
              i18nKey="imageRemoveBg.dropzone.description" 
              components={{ 
                span: <span className="text-primary font-medium" /> 
              }}
            />
          </p>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-md">
            {errorMessage}
          </div>
        )}

        {processingResults.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {t('imageRemoveBg.results.title')}（{processingResults.length}）
              </h3>
              {processingResults.some(r => r.status === 'completed') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchDownload}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  {t('imageRemoveBg.buttons.downloadAll')}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processingResults.map((result) => (
                <div
                  key={result.id}
                  className="border dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-3 border-b md:border-b-0 md:border-r dark:border-gray-700">
                      <div className="mb-1 text-sm font-medium">
                        {t('imageRemoveBg.results.original')}
                      </div>
                      <div className="h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded overflow-hidden">
                        <img
                          src={result.originalUrl}
                          alt="Original"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </div>
                    <div className="flex-1 p-3">
                      <div className="mb-1 text-sm font-medium">
                        {t('imageRemoveBg.results.processed')}
                      </div>
                      <div 
                        className="h-48 flex items-center justify-center rounded overflow-hidden"
                        style={result.status === 'completed' ? checkerboardStyle : undefined}
                      >
                        {result.status === 'processing' ? (
                          <div className="text-center">
                            <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
                            <div className="mt-2 w-36 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div
                                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${result.processingProgress}%` }}
                              ></div>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {result.processingProgress}%
                            </div>
                          </div>
                        ) : result.status === 'completed' ? (
                          <img
                            src={result.processedUrl}
                            alt="Processed"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-center text-red-500 p-4">
                            {result.error || '处理失败'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900">
                    <div className="text-xs text-gray-500">
                      {formatTime()} | {t('imageRemoveBg.results.processedTime')}: {formatProcessingTime(result.processingTime)}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        // className="h-4 w-4 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteResult(result.id)}
                        title={t('imageRemoveBg.buttons.delete')}
                      >
                        <Trash2 className="w-4 h-4 text-gray-500" />
                      </Button>
                   
                      {result.status === 'completed' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(result)}
                          title={t('imageRemoveBg.buttons.download')}
                        >
                          <Download className="w-4 h-4 text-gray-500" />
                        </Button>
                      )}
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

export default ImageRemoveBg;