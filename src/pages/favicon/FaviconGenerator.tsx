import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ToolLayout from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { File as FileIcon } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { IconPicker } from '@/components/icon-picker';

interface FaviconSize {
  size: string;
  dimensions: number;
  enabled: boolean;
}

interface GeneratedFavicon {
  name: string;
  blob: Blob;
  url: string;
  size: number;
}

type ShapeType = 'square' | 'circle' | 'rounded';

const FaviconGenerator = () => {
  const { t } = useTranslation();
  const [text, setText] = useState<string>('F');
  const [fontFamily, setFontFamily] = useState<string>('Arial');
  const [fontSize, setFontSize] = useState<number>(32);
  const [fontColor, setFontColor] = useState<string>('#FFFFFF');
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');
  const [selectedIcon, setSelectedIcon] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedFavicons, setGeneratedFavicons] = useState<GeneratedFavicon[]>([]);
  const [error, setError] = useState<string>('');
  const [backgroundColor, setBackgroundColor] = useState<string>('#06b6d4');
  const [shape, setShape] = useState<ShapeType>('square');
  
  // 配置不同尺寸的favicon
  const [faviconSizes] = useState<FaviconSize[]>([
    { size: 'favicon.ico', dimensions: 32, enabled: true },
    { size: 'apple-touch-icon.png', dimensions: 180, enabled: true },
    { size: 'favicon-16x16.png', dimensions: 16, enabled: true },
    { size: 'favicon-32x32.png', dimensions: 32, enabled: true },
    { size: 'android-chrome-192x192.png', dimensions: 192, enabled: true },
    { size: 'android-chrome-512x512.png', dimensions: 512, enabled: true },
  ]);

  // 字体列表
  const fontFamilies = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Tahoma', label: 'Tahoma' },
    { value: 'Trebuchet MS', label: 'Trebuchet MS' },
    { value: 'Impact', label: 'Impact' },
    { value: 'Comic Sans MS', label: 'Comic Sans MS' },
    { value: 'Palatino', label: 'Palatino' },
    { value: 'Garamond', label: 'Garamond' },
    { value: 'Bookman', label: 'Bookman' },
    { value: 'Avant Garde', label: 'Avant Garde' },
  ];

  const handleGenerateMethodChange = () => {
    setPreviewUrl(null);
    setGeneratedFavicons([]);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setSelectedEmoji(emojiData.emoji);
  };

  // 绘制形状背景
  const drawShape = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = backgroundColor;
    const radius = Math.min(width, height) * 0.2; // 20% 的圆角
    
    switch (shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'rounded':
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(width - radius, 0);
        ctx.quadraticCurveTo(width, 0, width, radius);
        ctx.lineTo(width, height - radius);
        ctx.quadraticCurveTo(width, height, width - radius, height);
        ctx.lineTo(radius, height);
        ctx.quadraticCurveTo(0, height, 0, height - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.fill();
        break;
      default: // square
        ctx.fillRect(0, 0, width, height);
    }
  };

  const generateFromText = async () => {
    try {
      const blobs = await Promise.all(
        faviconSizes.map(async (size) => {
          const canvas = document.createElement('canvas');
          canvas.width = size.dimensions;
          canvas.height = size.dimensions;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // 绘制形状背景
            drawShape(ctx, canvas.width, canvas.height);
            
            // 计算合适的字体大小
            const calculatedFontSize = Math.floor(size.dimensions * (fontSize / 100));
            
            // 设置文字样式
            ctx.fillStyle = fontColor;
            ctx.font = `${calculatedFontSize}px ${fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // 绘制文字
            ctx.fillText(text, canvas.width / 2, canvas.height / 2);
            
            // 转换为Blob
            const blob = await new Promise<Blob>((resolve, reject) => {
              canvas.toBlob(
                (b) => {
                  if (b) {
                    resolve(b);
                  } else {
                    reject(new Error('Failed to create blob'));
                  }
                },
                size.size.endsWith('.ico') ? 'image/x-icon' : 'image/png'
              );
            });
            
            return {
              name: size.size,
              blob,
              url: URL.createObjectURL(blob),
              size: blob.size
            };
          }
          throw new Error('Failed to get canvas context');
        })
      );
      
      setGeneratedFavicons(blobs);
      // 使用最大尺寸的图片作为预览
      const previewBlob = blobs.find(b => b.name === 'android-chrome-512x512.png');
      if (previewBlob) {
        setPreviewUrl(previewBlob.url);
      }
    } catch (err) {
      console.error('Text generation error:', err);
      setError(t('faviconGenerator.textGenerationError') || 'Failed to generate text favicon');
    }
  };

  const generateFromEmoji = async () => {
    try {
      const blobs = await Promise.all(
        faviconSizes.map(async (size) => {
          const canvas = document.createElement('canvas');
          canvas.width = size.dimensions;
          canvas.height = size.dimensions;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // 绘制形状背景
            drawShape(ctx, canvas.width, canvas.height);
            
            // 计算合适的字体大小
            const fontSize = Math.floor(size.dimensions * 0.8);
            
            // 设置emoji样式
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // 绘制emoji
            ctx.fillText(selectedEmoji, canvas.width / 2, canvas.height / 2);
            
            // 转换为Blob
            const blob = await new Promise<Blob>((resolve, reject) => {
              canvas.toBlob(
                (b) => {
                  if (b) {
                    resolve(b);
                  } else {
                    reject(new Error('Failed to create blob'));
                  }
                },
                size.size.endsWith('.ico') ? 'image/x-icon' : 'image/png'
              );
            });
            
            return {
              name: size.size,
              blob,
              url: URL.createObjectURL(blob),
              size: blob.size
            };
          }
          throw new Error('Failed to get canvas context');
        })
      );
      
      setGeneratedFavicons(blobs);
      // 使用最大尺寸的图片作为预览
      const previewBlob = blobs.find(b => b.name === 'android-chrome-512x512.png');
      if (previewBlob) {
        setPreviewUrl(previewBlob.url);
      }
    } catch (err) {
      console.error('Emoji generation error:', err);
      setError(t('faviconGenerator.emojiGenerationError') || 'Failed to generate emoji favicon');
    }
  };

  const generateFromIcon = async () => {
    try {
      // 先加载图标
      const iconImg = new Image();
      iconImg.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        iconImg.onload = resolve;
        iconImg.onerror = () => reject(new Error('Failed to load icon'));
        iconImg.src = selectedIcon;
      });

      const blobs = await Promise.all(
        faviconSizes.map(async (size) => {
          const canvas = document.createElement('canvas');
          canvas.width = size.dimensions;
          canvas.height = size.dimensions;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // 绘制形状背景
            drawShape(ctx, canvas.width, canvas.height);
            
            // 计算图标大小和位置
            const iconSize = Math.floor(size.dimensions * 0.6);
            const x = (size.dimensions - iconSize) / 2;
            const y = (size.dimensions - iconSize) / 2;
            
            // 绘制图标
            ctx.drawImage(iconImg, x, y, iconSize, iconSize);
            
            // 转换为Blob
            const blob = await new Promise<Blob>((resolve, reject) => {
              canvas.toBlob(
                (b) => {
                  if (b) {
                    resolve(b);
                  } else {
                    reject(new Error('Failed to create blob'));
                  }
                },
                size.size.endsWith('.ico') ? 'image/x-icon' : 'image/png'
              );
            });
            
            return {
              name: size.size,
              blob,
              url: URL.createObjectURL(blob),
              size: blob.size
            };
          }
          throw new Error('Failed to get canvas context');
        })
      );
      
      setGeneratedFavicons(blobs);
      // 使用最大尺寸的图片作为预览
      const previewBlob = blobs.find(b => b.name === 'android-chrome-512x512.png');
      if (previewBlob) {
        setPreviewUrl(previewBlob.url);
      }
    } catch (err) {
      console.error('Icon generation error:', err);
      setError(t('faviconGenerator.iconGenerationError') || 'Failed to generate icon favicon');
    }
  };

  const downloadFile = (favicon: GeneratedFavicon) => {
    const link = document.createElement('a');
    link.href = favicon.url;
    link.download = favicon.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllAsZip = async () => {
    const zip = new JSZip();
    
    generatedFavicons.forEach(favicon => {
      zip.file(favicon.name, favicon.blob);
    });
    
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'favicons.zip');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  // 添加通用的形状和背景颜色设置组件
  const ShapeAndBackgroundSettings = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div className="space-y-2">
        <Label>{t('faviconGenerator.shape') || 'Shape'}</Label>
        <Select value={shape} onValueChange={(value: ShapeType) => setShape(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="square">{t('faviconGenerator.shapes.square') || 'Square'}</SelectItem>
            <SelectItem value="circle">{t('faviconGenerator.shapes.circle') || 'Circle'}</SelectItem>
            <SelectItem value="rounded">{t('faviconGenerator.shapes.rounded') || 'Rounded'}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t('faviconGenerator.backgroundColor') || 'Background Color'}</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
          />
          <Input
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="w-12 p-1 h-10"
          />
        </div>
      </div>
    </div>
  );

  return (
    <ToolLayout
      categoryId="favicon"
      toolId="favicon-generator"
      title={t('faviconGenerator.title') || 'Favicon Generator'}
      description={`（${t('faviconGenerator.description')}）`}
    >
      <div className="space-y-6">
        <Tabs defaultValue="text" onValueChange={handleGenerateMethodChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text">{t('faviconGenerator.text') || 'Text'}</TabsTrigger>
            <TabsTrigger value="emoji">{t('faviconGenerator.emoji') || 'Emoji'}</TabsTrigger>
            <TabsTrigger value="icon">{t('faviconGenerator.icon') || 'Icon'}</TabsTrigger>
          </TabsList>

          <TabsContent value="text">
            <div className="space-y-4 p-6 border rounded-lg">
              <ShapeAndBackgroundSettings />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('faviconGenerator.textContent') || 'Text Content'}</Label>
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={2}
                    placeholder={t('faviconGenerator.textPlaceholder') || 'Enter 1-2 characters'}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>{t('faviconGenerator.font') || 'Font'}</Label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontFamilies.map((font) => (
                        <SelectItem 
                          key={font.value} 
                          value={font.value}
                          style={{ fontFamily: font.value }}
                        >
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>{t('faviconGenerator.fontSize') || 'Font Size'}</Label>
                  <Input
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    min={12}
                    max={100}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>{t('faviconGenerator.fontColor') || 'Font Color'}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={fontColor}
                      onChange={(e) => setFontColor(e.target.value)}
                    />
                    <Input
                      type="color"
                      value={fontColor}
                      onChange={(e) => setFontColor(e.target.value)}
                      className="w-12 p-1 h-10"
                    />
                  </div>
                </div>
              </div>
              
              <Button onClick={generateFromText}>{t('faviconGenerator.generateIcon') || 'Generate Icon'}</Button>
            </div>
          </TabsContent>

          <TabsContent value="emoji">
            <div className="space-y-4 p-6 border rounded-lg">
              <ShapeAndBackgroundSettings />
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width="100%"
              />
              {selectedEmoji && (
                <div className="flex items-center justify-between">
                  <div className="text-4xl">{selectedEmoji}</div>
                  <Button onClick={generateFromEmoji}>{t('faviconGenerator.generateIcon') || 'Generate Icon'}</Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="icon">
            <div className="space-y-4 p-6 border rounded-lg">
              <ShapeAndBackgroundSettings />
              <IconPicker onSelect={setSelectedIcon} />
              {selectedIcon && (
                <div className="flex items-center justify-between">
                  <img src={selectedIcon} alt={t('faviconGenerator.selectedIcon') || 'Selected icon'} className="w-12 h-12" />
                  <Button onClick={generateFromIcon}>{t('faviconGenerator.generateIcon') || 'Generate Icon'}</Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* 预览区域 */}
        {previewUrl && (
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">{t('faviconGenerator.preview') || 'Preview'}</h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {[...faviconSizes]
                .sort((a, b) => a.dimensions - b.dimensions)
                .map((size, index) => (
                  <div key={index} className="flex flex-col items-center shrink-0">
                    <div 
                      className="relative bg-gray-100 rounded-lg overflow-hidden mb-1"
                      style={{
                        width: Math.min(48, size.dimensions),
                        height: Math.min(48, size.dimensions),
                      }}
                    >
                      <img 
                        src={previewUrl} 
                        alt={`${t('faviconGenerator.preview')} ${size.dimensions}x${size.dimensions}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {size.dimensions}x{size.dimensions}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 生成结果 */}
        {generatedFavicons.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">
                {t('faviconGenerator.generationResults')}
              </h3>
              
              <Button
                variant="outline"
                onClick={downloadAllAsZip}
              >
                <FileIcon className="h-4 w-4 mr-2" />
                {t('faviconGenerator.downloadPackage')}
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3">{t('common.fileInfo')}</th>
                    <th className="text-right p-3">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedFavicons.map((favicon, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">
                        <div className="flex items-center space-x-3">
                          <div className="bg-muted/30 rounded p-1">
                            <FileIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{favicon.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(favicon.size)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadFile(favicon)}
                        >
                          {t('common.download')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md">
            {error}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default FaviconGenerator; 