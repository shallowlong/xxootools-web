import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import {
  UploadCloud,
  Download,
  Trash2,
  RefreshCw,
  Undo,
  Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ToolLayout from '@/components/tool/ToolLayout';

// 定义处理结果类型
interface ProcessingResult {
  id: string;
  originalFile: File;
  originalPreview: string;
  url: string;
  blockSize: number;
  shape: 'square' | 'circle'; // 马赛克形状
  format: string;
  timestamp: number;
  isProcessing: boolean;  // 是否正在处理中
  processingProgress: number; // 处理进度
  mosaicAreas: Array<{x: number, y: number, width: number, height: number}>;  // 马赛克区域
}

// 定义绘制状态类型
type DrawState = 'idle' | 'drawing' | 'editing';

const ImageMosaic = () => {
  const { t } = useTranslation();
  const [blockSize, setBlockSize] = useState(10); // 默认马赛克块大小为10像素
  const [mosaicShape, setMosaicShape] = useState<'square' | 'circle'>('square'); // 默认使用方形马赛克
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [drawState, setDrawState] = useState<DrawState>('idle');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editorCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const [startPosition, setStartPosition] = useState<{x: number, y: number} | null>(null);
  const [currentArea, setCurrentArea] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const [scale, setScale] = useState(1);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  // 处理文件选择和上传
  const processFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;
    
    // 添加图片到处理结果列表
    for (const file of files) {
      // 检查文件类型是否为图片
      if (!file.type.startsWith('image/')) continue;
      
      const fileId = generateId();
      
      // 创建预览
      const previewUrl = await createImagePreview(file);
      
      // 添加到结果列表
      const newResult: ProcessingResult = {
        id: fileId,
        originalFile: file,
        originalPreview: previewUrl,
        url: '',  // 尚未处理，URL为空
        blockSize: blockSize,
        shape: mosaicShape, // 使用当前选择的形状
        format: file.type.split('/')[1] || 'jpeg',
        timestamp: Date.now(),
        isProcessing: false,  // 不需要立即处理
        processingProgress: 0,
        mosaicAreas: []  // 初始没有马赛克区域
      };
      
      setProcessingResults(prev => [newResult, ...prev]);
      setSelectedResultId(fileId);  // 自动选择新上传的图片
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
  
  // 获取选中的图片结果
  const selectedResult = selectedResultId 
    ? processingResults.find(r => r.id === selectedResultId) 
    : null;
  
  // 对指定的ImageData应用马赛克效果
  const applyMosaicToImageData = (imageData: ImageData, blockSize: number, shape: 'square' | 'circle') => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 计算缩放后的块大小
    const scaledBlockSize = Math.max(1, Math.floor(blockSize / scale));
    const halfBlockSize = scaledBlockSize / 2;
    
    // 根据形状不同应用不同的马赛克效果
    for (let y = 0; y < height; y += scaledBlockSize) {
      for (let x = 0; x < width; x += scaledBlockSize) {
        // 计算此块的平均颜色
        let r = 0, g = 0, b = 0, a = 0, count = 0;
        const centerX = x + halfBlockSize;
        const centerY = y + halfBlockSize;
        
        // 收集块内所有像素
        for (let yy = y; yy < y + scaledBlockSize && yy < height; yy++) {
          for (let xx = x; xx < x + scaledBlockSize && xx < width; xx++) {
            // 对于圆形，检查像素是否在圆形范围内
            if (shape === 'circle') {
              const distance = Math.sqrt(Math.pow(xx - centerX, 2) + Math.pow(yy - centerY, 2));
              if (distance > halfBlockSize) continue; // 跳过圆形范围外的像素
            }
            
            const i = (yy * width + xx) * 4;
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            a += data[i + 3];
            count++;
          }
        }
        
        // 计算平均颜色
        if (count > 0) {
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          a = Math.round(a / count);
        }
        
        // 将块内所有像素设置为平均颜色
        for (let yy = y; yy < y + scaledBlockSize && yy < height; yy++) {
          for (let xx = x; xx < x + scaledBlockSize && xx < width; xx++) {
            // 对于圆形，只修改圆形范围内的像素
            if (shape === 'circle') {
              const distance = Math.sqrt(Math.pow(xx - centerX, 2) + Math.pow(yy - centerY, 2));
              if (distance > halfBlockSize) continue; // 跳过圆形范围外的像素
            }
            
            const i = (yy * width + xx) * 4;
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
            data[i + 3] = a;
          }
        }
      }
    }
  };
  
  // 绘制马赛克区域
  const drawMosaicAreas = useCallback(() => {
    if (!selectedResult || !editorCanvasRef.current) return;
    
    const canvas = editorCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 重新载入原图
    const img = new Image();
    img.onload = () => {
      // 清除并重绘图片
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // 绘制所有马赛克区域
      selectedResult.mosaicAreas.forEach(area => {
        // 将原图坐标转换为canvas坐标
        const canvasX = area.x / scale;
        const canvasY = area.y / scale;
        const canvasWidth = area.width / scale;
        const canvasHeight = area.height / scale;
        
        // 绘制选择框
        ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)';
        ctx.lineWidth = 2;
        
        if (selectedResult.shape === 'circle') {
          // 圆形选择框 - 使用椭圆
          ctx.beginPath();
          const centerX = canvasX + canvasWidth / 2;
          const centerY = canvasY + canvasHeight / 2;
          const radiusX = canvasWidth / 2;
          const radiusY = canvasHeight / 2;
          
          // 使用椭圆形绘制，或者回退到arc方法
          if (typeof ctx.ellipse === 'function') {
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
          } else {
            // 回退方法：当椭圆不支持时使用近似方法
            const step = 0.05;
            ctx.moveTo(centerX + radiusX, centerY);
            for (let i = 0; i < 2 * Math.PI; i += step) {
              ctx.lineTo(
                centerX + radiusX * Math.cos(i),
                centerY + radiusY * Math.sin(i)
              );
            }
            ctx.closePath();
          }
          ctx.stroke();
        } else {
          // 方形选择框
          ctx.strokeRect(canvasX, canvasY, canvasWidth, canvasHeight);
        }
        
        // 获取区域内的图像数据
        const areaData = ctx.getImageData(canvasX, canvasY, canvasWidth, canvasHeight);
        
        // 应用马赛克效果
        applyMosaicToImageData(areaData, selectedResult.blockSize, selectedResult.shape);
        
        // 将处理后的数据放回canvas
        ctx.putImageData(areaData, canvasX, canvasY);
      });
      
      // 如果正在绘制新区域，也绘制出来
      if (drawState === 'drawing' && startPosition && currentArea) {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        
        if (mosaicShape === 'circle') {
          // 绘制圆形选择区域
          ctx.beginPath();
          const centerX = currentArea.x + currentArea.width / 2;
          const centerY = currentArea.y + currentArea.height / 2;
          const radiusX = currentArea.width / 2;
          const radiusY = currentArea.height / 2;
          
          if (typeof ctx.ellipse === 'function') {
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
          } else {
            // 回退方法
            const step = 0.05;
            ctx.moveTo(centerX + radiusX, centerY);
            for (let i = 0; i < 2 * Math.PI; i += step) {
              ctx.lineTo(
                centerX + radiusX * Math.cos(i),
                centerY + radiusY * Math.sin(i)
              );
            }
            ctx.closePath();
          }
          ctx.stroke();
        } else {
          // 方形选择区域
          ctx.strokeRect(
            currentArea.x, 
            currentArea.y, 
            currentArea.width, 
            currentArea.height
          );
        }
      }
    };
    
    img.src = selectedResult.originalPreview;
  }, [selectedResult, scale, drawState, startPosition, currentArea, mosaicShape]);
  
  // 加载选中的图片到编辑器
  useEffect(() => {
    if (!selectedResult || !editorCanvasRef.current) return;
    
    const resizeCanvas = () => {
      const canvas = editorCanvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const img = new Image();
      img.onload = () => {
        // 计算缩放比例，使图片适应编辑器容器
        const containerWidth = canvas.parentElement?.clientWidth || 800;
        const containerHeight = 500; // 固定高度
        
        const imgRatio = img.width / img.height;
        const containerRatio = containerWidth / containerHeight;
        
        let newWidth, newHeight;
        
        if (imgRatio > containerRatio) {
          // 图片更宽，以宽度为准
          newWidth = containerWidth;
          newHeight = containerWidth / imgRatio;
        } else {
          // 图片更高，以高度为准
          newHeight = containerHeight;
          newWidth = containerHeight * imgRatio;
        }
        
        // 设置canvas尺寸
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // 保存原图尺寸和缩放比例
        setScale(img.width / newWidth);
        setImageSize({ width: img.width, height: img.height });
        
        // 绘制图片
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        // 绘制已有的马赛克区域
        drawMosaicAreas();
      };
      
      img.src = selectedResult.originalPreview;
    };
    
    // 初始渲染
    resizeCanvas();
    
    // 添加窗口大小变化监听
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [selectedResult, selectedResultId, drawMosaicAreas]);
  
  // 撤销上一次添加的马赛克区域，使用useCallback包装
  const handleUndoLastArea = useCallback(() => {
    if (!selectedResult || selectedResult.mosaicAreas.length === 0) return;
    
    setProcessingResults(prev => 
      prev.map(item => 
        item.id === selectedResult.id 
          ? { 
              ...item, 
              mosaicAreas: item.mosaicAreas.slice(0, -1) 
            }
          : item
      )
    );
    
    // 重新绘制
    drawMosaicAreas();
  }, [selectedResult, drawMosaicAreas]);
  
  // 增强键盘事件监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('Key pressed:', e.key);  // 添加日志以便调试
      
      // ESC键取消当前选择
      if (e.key === 'Escape') {
        console.log('ESC pressed, current drawState:', drawState);
        if (drawState === 'drawing') {
          setDrawState('idle');
          setStartPosition(null);
          setCurrentArea(null);
          drawMosaicAreas();
        }
      }
      
      // Z键撤销上一个马赛克区域
      if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) {
        console.log('Ctrl+Z pressed');
        handleUndoLastArea();
        e.preventDefault(); // 防止浏览器默认的撤销行为
      }
    };
    
    // 使用 document 而不是 window 来监听键盘事件，这可能更可靠
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawState, drawMosaicAreas, handleUndoLastArea]);
  
  // 处理鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editorCanvasRef.current || !selectedResult) return;
    
    const canvas = editorCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDrawState('drawing');
    setStartPosition({ x, y });
    setCurrentArea({ x, y, width: 0, height: 0 });
  };
  
  // 处理鼠标移动事件
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawState !== 'drawing' || !startPosition || !editorCanvasRef.current) return;
    
    const canvas = editorCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const width = x - startPosition.x;
    const height = y - startPosition.y;
    
    setCurrentArea({
      x: width >= 0 ? startPosition.x : x,
      y: height >= 0 ? startPosition.y : y,
      width: Math.abs(width),
      height: Math.abs(height)
    });
    
    // 重新绘制以显示选择框
    drawMosaicAreas();
  };
  
  // 处理鼠标抬起事件
  const handleMouseUp = () => {
    if (drawState !== 'drawing' || !startPosition || !currentArea || !selectedResult) return;
    
    // 忽略太小的区域
    if (currentArea.width < 5 || currentArea.height < 5) {
      setDrawState('idle');
      setStartPosition(null);
      setCurrentArea(null);
      return;
    }
    
    // 将canvas坐标转换为原图坐标
    const originalArea = {
      x: Math.round(currentArea.x * scale),
      y: Math.round(currentArea.y * scale),
      width: Math.round(currentArea.width * scale),
      height: Math.round(currentArea.height * scale)
    };
    
    // 添加到马赛克区域列表
    setProcessingResults(prev => 
      prev.map(item => 
        item.id === selectedResult.id 
          ? { 
              ...item, 
              mosaicAreas: [...item.mosaicAreas, originalArea] 
            }
          : item
      )
    );
    
    // 重置绘制状态
    setDrawState('idle');
    setStartPosition(null);
    setCurrentArea(null);
    
    // 重新绘制以显示新添加的马赛克区域
    drawMosaicAreas();
  };
  
  // 修改鼠标离开事件，让它也能取消绘制
  const handleMouseLeave = () => {
    if (drawState === 'drawing') {
      setDrawState('idle');
      setStartPosition(null);
      setCurrentArea(null);
      drawMosaicAreas();
    }
  };
  
  // 处理最终图片
  const processFinalImage = async () => {
    if (!selectedResult || !canvasRef.current || !editorCanvasRef.current) return;
    
    try {
      // 更新处理状态
      setProcessingResults(prev => 
        prev.map(item => 
          item.id === selectedResult.id 
            ? { ...item, isProcessing: true, processingProgress: 0 }
            : item
        )
      );
      
      // 加载原始图片
      const img = new Image();
      img.src = selectedResult.originalPreview;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });
      
      // 设置canvas尺寸与原图一致
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error(t('imageMosaic.errors.canvasContextNotAvailable'));
      }
      
      // 绘制原始图像
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // 更新进度
      updateProcessingProgress(selectedResult.id, 30);
      
      // 应用所有马赛克区域
      for (let i = 0; i < selectedResult.mosaicAreas.length; i++) {
        const area = selectedResult.mosaicAreas[i];
        
        // 获取区域内的图像数据
        const imageData = ctx.getImageData(area.x, area.y, area.width, area.height);
        
        // 应用马赛克效果
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        // 应用马赛克效果
        const halfBlockSize = selectedResult.blockSize / 2;
        
        for (let y = 0; y < height; y += selectedResult.blockSize) {
          for (let x = 0; x < width; x += selectedResult.blockSize) {
            // 计算此块的平均颜色
            let r = 0, g = 0, b = 0, a = 0, count = 0;
            const centerX = x + halfBlockSize;
            const centerY = y + halfBlockSize;
            
            // 收集块内所有像素
            for (let yy = y; yy < y + selectedResult.blockSize && yy < height; yy++) {
              for (let xx = x; xx < x + selectedResult.blockSize && xx < width; xx++) {
                // 对于圆形，检查像素是否在圆形范围内
                if (selectedResult.shape === 'circle') {
                  const distance = Math.sqrt(Math.pow(xx - centerX, 2) + Math.pow(yy - centerY, 2));
                  if (distance > halfBlockSize) continue; // 跳过圆形范围外的像素
                }
                
                const i = (yy * width + xx) * 4;
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                a += data[i + 3];
                count++;
              }
            }
            
            // 计算平均颜色
            if (count > 0) {
              r = Math.round(r / count);
              g = Math.round(g / count);
              b = Math.round(b / count);
              a = Math.round(a / count);
            }
            
            // 将块内所有像素设置为平均颜色
            for (let yy = y; yy < y + selectedResult.blockSize && yy < height; yy++) {
              for (let xx = x; xx < x + selectedResult.blockSize && xx < width; xx++) {
                // 对于圆形，只修改圆形范围内的像素
                if (selectedResult.shape === 'circle') {
                  const distance = Math.sqrt(Math.pow(xx - centerX, 2) + Math.pow(yy - centerY, 2));
                  if (distance > halfBlockSize) continue; // 跳过圆形范围外的像素
                }
                
                const i = (yy * width + xx) * 4;
                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
                data[i + 3] = a;
              }
            }
          }
        }
        
        // 将处理后的数据放回canvas
        ctx.putImageData(imageData, area.x, area.y);
        
        // 更新进度
        updateProcessingProgress(selectedResult.id, 30 + 60 * ((i + 1) / selectedResult.mosaicAreas.length));
      }
      
      // 将canvas转换为URL
      const processedDataURL = canvas.toDataURL(selectedResult.originalFile.type || 'image/jpeg');
      
      // 更新处理结果
      setTimeout(() => {
        setProcessingResults(prev => 
          prev.map(item => 
            item.id === selectedResult.id 
              ? {
                  ...item,
                  url: processedDataURL,
                  isProcessing: false,
                  processingProgress: 100
                }
              : item
          )
        );
      }, 500); // 稍微延迟，让进度条动画更平滑
      
    } catch (error) {
      console.error(t('imageMosaic.errors.processingError'), error);
      
      // 处理失败，更新状态
      setProcessingResults(prev => 
        prev.map(item => 
          item.id === selectedResult.id 
            ? { ...item, isProcessing: false }
            : item
        )
      );
    }
  };
  
  // 更新处理进度
  const updateProcessingProgress = (id: string, progress: number) => {
    setProcessingResults(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, processingProgress: progress }
          : item
      )
    );
  };
  
  // 下载处理后的图片
  const handleDownload = (result: ProcessingResult) => {
    if (!result.url) return;
    
    try {
      // 从文件名中获取扩展名
      const originalName = result.originalFile.name;
      const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
      const extension = originalName.split('.').pop() || 'jpg';
      
      // 创建下载链接
      const link = document.createElement('a');
      link.href = result.url;
      link.download = `${nameWithoutExt}_mosaic.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(t('imageMosaic.errors.downloadFailed'), error);
    }
  };
  
  // 批量下载所有处理后的图片
  const handleDownloadAll = async () => {
    // 获取所有已完成处理的结果
    const completedResults = processingResults.filter(result => !result.isProcessing && result.url);
    
    if (completedResults.length === 0) return;
    
    const zip = new JSZip();
    
    // 添加每个图片到zip
    completedResults.forEach(result => {
      // 从Data URL中提取base64数据
      const base64Data = result.url.split(',')[1];
      
      // 获取文件名
      const originalName = result.originalFile.name;
      const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
      const extension = originalName.split('.').pop() || 'jpg';
      
      // 添加到zip
      zip.file(`${nameWithoutExt}_mosaic.${extension}`, base64Data, { base64: true });
    });
    
    try {
      // 生成zip文件
      const content = await zip.generateAsync({ type: 'blob' });
      
      // 下载zip文件
      const date = new Date().toISOString().slice(0, 10);
      saveAs(content, `${t('imageMosaic.title')}_${date}.zip`);
    } catch (error) {
      console.error(t('imageMosaic.errors.createZipError'), error);
    }
  };
  
  // 从图片列表中删除图片
  const handleDeleteResult = (id: string) => {
    setProcessingResults(prev => prev.filter(r => r.id !== id));
    if (selectedResultId === id) {
      setSelectedResultId(processingResults.find(r => r.id !== id)?.id || null);
    }
  };
  
  // 选择图片进行编辑
  const handleSelectResult = (id: string) => {
    setSelectedResultId(id);
  };
  
  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
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
  
  // 监听形状变更，更新当前选中图片的形状
  useEffect(() => {
    if (selectedResultId && selectedResult) {
      setProcessingResults(prev => 
        prev.map(item => 
          item.id === selectedResultId 
            ? { ...item, shape: mosaicShape }
            : item
        )
      );
      
      // 如果已有马赛克区域，重新绘制
      if (selectedResult.mosaicAreas.length > 0) {
        drawMosaicAreas();
      }
    }
  }, [mosaicShape, selectedResultId, selectedResult, drawMosaicAreas]);
  
  // 增加一个显示当前形状的辅助函数
  const getShapeDisplayText = (shape: 'square' | 'circle') => {
    return shape === 'square' ? t('imageMosaic.square') : t('imageMosaic.circle');
  };
  
  return (
    <ToolLayout
      categoryId="image"
      toolId="image-mosaic"
      title={t('imageMosaic.title')}
      description={`（${t('imageMosaic.description')}）`}
    >
      <div className="space-y-6">
        {/* 隐藏的canvas用于最终图片处理 */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* 上传区域 */}
        {processingResults.length === 0 && (
          <div 
            ref={dropzoneRef}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-300 dark:border-gray-700'}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <UploadCloud className="w-12 h-12 mb-4 text-gray-500 dark:text-gray-400" />
            <p className="mb-2 text-sm text-center">
              {isDragging 
                ? <Trans i18nKey="imageMosaic.dragMessage" />
                : <Trans i18nKey="imageMosaic.clickOrDragToUpload" />
              }
            </p>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              <Trans 
                i18nKey="imageMosaic.supportedFormats"
                values={{ formats: "JPEG, PNG, GIF, WebP" }}
                components={{ span: <span className="font-semibold text-primary" /> }}
              />
            </p>
          </div>
        )}
        
        {/* 编辑器区域 */}
        {processingResults.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* 左侧图片列表 */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{t('imageMosaic.imageList')}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <UploadCloud className="w-4 h-4 mr-2" />
                  {t('common.upload')}
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/30 px-3 py-2 border-b">
                  <div className="text-xs text-gray-500 flex justify-between">
                    <span>{processingResults.length} {t('imageMosaic.images')}</span>
                    {processingResults.length > 0 && (
                      <button 
                        className="text-gray-500 hover:text-primary text-xs"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        + {t('imageMosaic.addMore')}
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {processingResults.map((result) => (
                    <div 
                      key={result.id} 
                      className={`flex items-center p-2 cursor-pointer hover:bg-muted/50 ${selectedResultId === result.id ? 'bg-muted' : ''}`}
                      onClick={() => handleSelectResult(result.id)}
                    >
                      <div className="w-12 h-12 rounded-md overflow-hidden border bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                        <img src={result.originalPreview} alt={result.originalFile.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow truncate">
                        <div className="font-medium truncate">{result.originalFile.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(result.originalFile.size)}
                          {result.mosaicAreas.length > 0 && (
                            <span className="ml-2 text-primary">
                              {result.mosaicAreas.length} {t('imageMosaic.areas')}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteResult(result.id);
                        }}
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 右侧编辑区域 - 这是我们要优化的部分 */}
            <div className="lg:col-span-3 space-y-4">
              {selectedResult ? (
                <>
                  <div className="border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {/* 工具栏 - 简化版 */}
                    <div className="flex items-center justify-between p-2 bg-muted/30 border-b">
                      <div className="flex items-center space-x-4">
                        {/* 马赛克形状选择 */}
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-2">{t('imageMosaic.shape')}:</span>
                          <div className="flex border rounded overflow-hidden">
                            <button 
                              className={`px-2 py-1 text-xs flex items-center ${mosaicShape === 'square' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                              onClick={() => setMosaicShape('square')}
                              title={t('imageMosaic.squareShape')}
                            >
                              <span className="mr-1">□</span> {t('imageMosaic.square')}
                            </button>
                            <button 
                              className={`px-2 py-1 text-xs flex items-center ${mosaicShape === 'circle' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                              onClick={() => setMosaicShape('circle')}
                              title={t('imageMosaic.circleShape')}
                            >
                              <span className="mr-1">○</span> {t('imageMosaic.circle')}
                            </button>
                          </div>
                        </div>
                        
                        {/* 马赛克大小设置 */}
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-2">{t('imageMosaic.blockSize')}:</span>
                          <div className="flex items-center">
                            <span className="text-xs w-5 text-center">{blockSize}</span>
                            <Slider
                              value={[blockSize]}
                              min={3}
                              max={30}
                              step={1}
                              onValueChange={(value) => setBlockSize(value[0])}
                              className="w-40 mx-2"
                            />
                            <span className="text-xs w-5 text-center">30</span>
                          </div>
                          <div className="flex ml-2 border rounded overflow-hidden">
                            {[5, 10, 15, 20].map(size => (
                              <button 
                                key={size} 
                                className={`w-8 h-6 flex items-center justify-center text-xs border-r last:border-r-0 ${blockSize === size ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                                onClick={() => setBlockSize(size)}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleUndoLastArea}
                          disabled={!selectedResult.mosaicAreas.length}
                          className="h-7 text-xs px-2"
                          title="撤销上一个区域 (Ctrl+Z)"
                        >
                          <Undo className="w-3 h-3 mr-1" />
                          {t('imageMosaic.undo')}
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={processFinalImage}
                          disabled={selectedResult.isProcessing || selectedResult.mosaicAreas.length === 0}
                          className="h-7 text-xs px-2"
                        >
                          {selectedResult.isProcessing ? (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              {Math.round(selectedResult.processingProgress)}%
                            </>
                          ) : (
                            t('imageMosaic.applyMosaic')
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* 编辑画布 - 简化版 */}
                    <div className="relative">
                      <canvas 
                        ref={editorCanvasRef}
                        className="cursor-crosshair max-w-full"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                      />
                      {selectedResult.mosaicAreas.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-100/60 dark:bg-gray-800/60 dark:text-gray-400 pointer-events-none">
                          <div className="text-center max-w-xs mx-auto bg-background/90 p-3 rounded-lg border shadow-sm">
                            <div className="mb-2 font-medium">{t('imageMosaic.dragToSelect')}</div>
                            <div className="text-xs opacity-80 mb-2">{t('imageMosaic.tip')}</div>
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <div className="text-xs text-muted-foreground mt-1 flex justify-between items-center">
                                <span>□ / ○</span>
                                <span>切换马赛克形状</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 flex justify-between items-center">
                                <span>ESC</span>
                                <span>取消选择</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 flex justify-between items-center">
                                <span>Ctrl+Z</span>
                                <span>撤销上一个区域</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* 形状和大小信息提示 - 当有区域时显示 */}
                      {selectedResult.mosaicAreas.length > 0 && (
                        <div className="absolute top-2 left-2 bg-background/80 text-xs px-2 py-1 rounded-md border shadow-sm">
                          {getShapeDisplayText(selectedResult.shape)} • {blockSize}px
                        </div>
                      )}
                      
                      {/* 显示ESC键提示当用户正在绘制马赛克区域时 */}
                      {drawState === 'drawing' && (
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          按<kbd className="px-1 ml-1 mr-1 border rounded bg-gray-700">ESC</kbd>取消选择
                        </div>
                      )}
                      
                      {/* 信息覆盖层 */}
                      <div className="absolute bottom-2 right-2 bg-background/80 text-xs px-2 py-1 rounded-md border shadow-sm">
                        {selectedResult.mosaicAreas.length > 0 && (
                          <span className="mr-2">
                            {selectedResult.mosaicAreas.length} {t('imageMosaic.areas')}
                          </span>
                        )}
                        {imageSize.width > 0 && (
                          <span>{imageSize.width} × {imageSize.height} px</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* 处理结果 - 简化版 */}
                  {selectedResult.url && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between p-2 bg-muted/30 border-b">
                        <h4 className="text-sm font-medium">{t('imageMosaic.processedResult')}</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(selectedResult)}
                          className="h-7 text-xs px-2"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          {t('common.download')}
                        </Button>
                      </div>
                      <div className="relative">
                        <img 
                          src={selectedResult.url} 
                          alt={selectedResult.originalFile.name} 
                          className="max-w-full" 
                        />
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {selectedResult.mosaicAreas.length} {t('imageMosaic.areas')} • {selectedResult.blockSize}px • 
                          {getShapeDisplayText(selectedResult.shape)}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="border rounded-lg p-8 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p>{t('imageMosaic.selectImagePrompt')}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 批量下载按钮 */}
        {processingResults.some(r => r.url) && (
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={handleDownloadAll}
            >
              <Archive className="w-4 h-4 mr-2" />
              {t('imageMosaic.downloadAll')}
            </Button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default ImageMosaic; 