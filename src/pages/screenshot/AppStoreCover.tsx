import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Download, Type, Image as ImageIcon, Move, Plus, Trash } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ToolLayout from '@/components/tool/ToolLayout';

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  rotation: number;
  isDragging: boolean;
  isSelected: boolean;
}

interface AppStoreCoverData {
  backgroundColor: string;
  backgroundImage?: File;
}



const DEVICE_SIZES = [
  { 
    label: 'iPhone 6.7" (1290x2796)', 
    value: 'iphone', 
    width: 1290, 
    height: 2796,
    description: 'iPhone 14 Pro Max / 15 Pro Max'
  },
  { 
    label: 'iPhone 6.1" (1179x2556)', 
    value: 'iphone-6.1', 
    width: 1179, 
    height: 2556,
    description: 'iPhone 14 / 15 / 15 Pro'
  },
  { 
    label: 'iPhone 5.5" (1242x2208)', 
    value: 'iphone-5.5', 
    width: 1242, 
    height: 2208,
    description: 'iPhone 8 Plus / 7 Plus'
  },
  { 
    label: 'iPad 12.9" (2048x2732)', 
    value: 'ipad-12.9', 
    width: 2048, 
    height: 2732,
    description: 'iPad Pro 12.9"'
  },
  { 
    label: 'iPad 11" (1668x2388)', 
    value: 'ipad-11', 
    width: 1668, 
    height: 2388,
    description: 'iPad Pro 11" / Air'
  },
  { 
    label: 'iPad 10.9" (1640x2360)', 
    value: 'ipad-10.9', 
    width: 1640, 
    height: 2360,
    description: 'iPad 10.9"'
  },
  { 
    label: 'Mac (1280x800)', 
    value: 'mac', 
    width: 1280, 
    height: 800,
    description: 'Mac App Store'
  },
];

const AppStoreCover: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const FONT_OPTIONS = [
    { label: t('fonts.system'), value: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' },
    { label: t('fonts.notoSans'), value: 'Noto Sans SC, sans-serif' },
    { label: t('fonts.notoSerif'), value: 'Noto Serif SC, serif' },
    { label: t('fonts.pingFang'), value: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' },
    { label: t('fonts.microsoftYaHei'), value: 'Microsoft YaHei, sans-serif' },
    { label: t('fonts.stHeiti'), value: 'STHeiti, sans-serif' },
    { label: t('fonts.stSong'), value: 'STSong, serif' },
    { label: t('fonts.kaiTi'), value: 'KaiTi, serif' },
    { label: t('fonts.fangSong'), value: 'FangSong, serif' },
    { label: t('fonts.simHei'), value: 'SimHei, sans-serif' },
    { label: t('fonts.simSun'), value: 'SimSun, serif' },
    { label: t('fonts.youYuan'), value: 'YouYuan, sans-serif' },
    { label: t('fonts.liSu'), value: 'LiSu, serif' },
    { label: t('fonts.stXingkai'), value: 'STXingkai, cursive' },
    { label: t('fonts.stXinwei'), value: 'STXinwei, serif' },
  ];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [coverData, setCoverData] = useState<AppStoreCoverData>({
    backgroundColor: '#004719',
  });

  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [selectedDevice, setSelectedDevice] = useState(DEVICE_SIZES[0]);
  const [textElements, setTextElements] = useState<TextElement[]>([
    {
      id: '1',
      text: t('screenshot.appstore.defaultText'),
      x: 100,
      y: 100,
      fontSize: 48,
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      color: '#FFFFFF',
      rotation: 0,
      isDragging: false,
      isSelected: true,
    }
  ]);
  const [selectedTextId, setSelectedTextId] = useState<string>('1');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const getSelectedText = () => textElements.find(el => el.id === selectedTextId);

  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const generateCover = async () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸
    canvas.width = selectedDevice.width;
    canvas.height = selectedDevice.height;

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景
    ctx.fillStyle = coverData.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 如果有背景图片，绘制背景图片
    if (coverData.backgroundImage) {
      const img = new Image();
      img.onload = () => {
        // 计算图片缩放比例以适应画布，保持比例
        const scaleX = canvas.width / img.width;
        const scaleY = canvas.height / img.height;
        const scale = Math.min(scaleX, scaleY);
        
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const x = (canvas.width - scaledWidth) / 2;
        const y = (canvas.height - scaledHeight) / 2;

        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        drawTexts();
        setPreviewUrl(canvas.toDataURL('image/png'));
      };
      img.onerror = () => {
        drawTexts();
        setPreviewUrl(canvas.toDataURL('image/png'));
      };
      img.src = URL.createObjectURL(coverData.backgroundImage);
    } else {
      drawTexts();
      setPreviewUrl(canvas.toDataURL('image/png'));
    }

    function drawTexts() {
      if (!ctx) return;
      
      textElements.forEach(element => {
        ctx.save();
        ctx.translate(element.x, element.y);
        ctx.rotate(element.rotation * Math.PI / 180);
        
        ctx.fillStyle = element.color;
        ctx.font = `bold ${element.fontSize}px ${element.fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(element.text, 0, 0);
        
        ctx.restore();
      });
    }
  };

  const generatePreview = () => {
    if (!previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 计算预览画布的显示尺寸
    const maxWidth = 400;
    const maxHeight = 600;
    const scale = Math.min(maxWidth / selectedDevice.width, maxHeight / selectedDevice.height);
    const displayWidth = Math.round(selectedDevice.width * scale);
    const displayHeight = Math.round(selectedDevice.height * scale);
    
    // 设置画布的显示尺寸
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    
    // 启用高DPI支持
    const dpr = window.devicePixelRatio || 1;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    
    // 缩放上下文以匹配设备像素比
    ctx.scale(dpr, dpr);

    // 清除画布
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // 绘制背景
    ctx.fillStyle = coverData.backgroundColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // 如果有背景图片，绘制背景图片
    if (coverData.backgroundImage) {
      const img = new Image();
      img.onload = () => {
        // 重新绘制背景
        ctx.fillStyle = coverData.backgroundColor;
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        
        // 计算图片缩放比例以适应画布，保持比例
        const scaleX = displayWidth / img.width;
        const scaleY = displayHeight / img.height;
        const imgScale = Math.min(scaleX, scaleY);
        
        const scaledWidth = img.width * imgScale;
        const scaledHeight = img.height * imgScale;
        const x = (displayWidth - scaledWidth) / 2;
        const y = (displayHeight - scaledHeight) / 2;

        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        drawTexts();
      };
      img.onerror = () => {
        drawTexts();
      };
      img.src = URL.createObjectURL(coverData.backgroundImage);
    } else {
      drawTexts();
    }

    function drawTexts() {
      if (!ctx) return;
      
      textElements.forEach(element => {
        ctx.save();
        
        // 计算缩放后的位置和尺寸
        const scaledX = element.x * scale;
        const scaledY = element.y * scale;
        const scaledFontSize = Math.round(element.fontSize * scale);
        
        ctx.translate(scaledX, scaledY);
        ctx.rotate(element.rotation * Math.PI / 180);
        
        ctx.fillStyle = element.color;
        ctx.font = `bold ${scaledFontSize}px ${element.fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // 启用字体平滑
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.fillText(element.text, 0, 0);
        
        // 绘制选择框
        if (element.isSelected) {
          const metrics = ctx.measureText(element.text);
          const textWidth = metrics.width;
          const textHeight = scaledFontSize;
          
          // 绘制选择框
          ctx.strokeStyle = '#007AFF';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(-5, -5, textWidth + 10, textHeight + 10);
          ctx.setLineDash([]);
          
          // 绘制四个角的调整手柄
          const handleSize = 6;
          ctx.fillStyle = '#007AFF';
          ctx.fillRect(-5 - handleSize/2, -5 - handleSize/2, handleSize, handleSize); // 左上
          ctx.fillRect(textWidth + 5 - handleSize/2, -5 - handleSize/2, handleSize, handleSize); // 右上
          ctx.fillRect(-5 - handleSize/2, textHeight + 5 - handleSize/2, handleSize, handleSize); // 左下
          ctx.fillRect(textWidth + 5 - handleSize/2, textHeight + 5 - handleSize/2, handleSize, handleSize); // 右下
          
          // 绘制旋转手柄
          ctx.fillStyle = '#FF6B6B';
          ctx.fillRect(textWidth / 2 - 3, -20, 6, 6);
          
          // 绘制旋转线
          ctx.strokeStyle = '#FF6B6B';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(textWidth / 2, -5);
          ctx.lineTo(textWidth / 2, -14);
          ctx.stroke();
        }
        
        ctx.restore();
      });
    }
  };

  useEffect(() => {
    generateCover();
  }, [coverData, selectedDevice, textElements]);

  useEffect(() => {
    generatePreview();
  }, [coverData, selectedDevice, textElements]);

  const handleDownload = () => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    const appName = textElements[0]?.text || 'app';
    link.download = `${appName}-appstore-${selectedDevice.value}-cover.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleFileChange = (field: 'backgroundImage', file: File) => {
    setCoverData(prev => ({ ...prev, [field]: file }));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const maxWidth = 400;
    const maxHeight = 600;
    const scale = Math.min(maxWidth / selectedDevice.width, maxHeight / selectedDevice.height);
    
    // 计算实际的鼠标位置
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    // 重新生成预览画布来获取正确的文本尺寸
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // 检查是否点击了文本（从后往前检查，这样上面的文本优先）
    for (let i = textElements.length - 1; i >= 0; i--) {
      const element = textElements[i];
      
      // 设置字体以获取正确的文本尺寸
      tempCtx.font = `bold ${element.fontSize}px ${element.fontFamily}`;
      const metrics = tempCtx.measureText(element.text);
      const textWidth = metrics.width;
      const textHeight = element.fontSize;
      
      // 考虑旋转的边界框
      const cos = Math.cos(element.rotation * Math.PI / 180);
      const sin = Math.sin(element.rotation * Math.PI / 180);
      
      // 计算旋转后的边界框
      const corners = [
        { x: 0, y: 0 },
        { x: textWidth, y: 0 },
        { x: textWidth, y: textHeight },
        { x: 0, y: textHeight }
      ];
      
      const rotatedCorners = corners.map(corner => ({
        x: corner.x * cos - corner.y * sin + element.x,
        y: corner.x * sin + corner.y * cos + element.y
      }));
      
      // 简单的点是否在多边形内的检测
      const isInside = isPointInPolygon(x, y, rotatedCorners);
      
      if (isInside) {
        setSelectedTextId(element.id);
        setTextElements(prev => prev.map(el => ({
          ...el,
          isSelected: el.id === element.id
        })));
        setIsDragging(true);
        setDragStart({ x: x - element.x, y: y - element.y });
        return;
      }
    }
    
    // 如果没有点击到文本，取消选择
    setTextElements(prev => prev.map(el => ({ ...el, isSelected: false })));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedTextId) return;

    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const maxWidth = 400;
    const maxHeight = 600;
    const scale = Math.min(maxWidth / selectedDevice.width, maxHeight / selectedDevice.height);
    
    // 计算实际的鼠标位置
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    // 确保文本不会拖出画布边界
    const newX = Math.max(0, Math.min(selectedDevice.width - 100, x - dragStart.x));
    const newY = Math.max(0, Math.min(selectedDevice.height - 50, y - dragStart.y));

    updateTextElement(selectedTextId, {
      x: newX,
      y: newY
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 辅助函数：检测点是否在多边形内
  const isPointInPolygon = (x: number, y: number, polygon: { x: number, y: number }[]) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  };

  const addTextElement = () => {
    const newId = Date.now().toString();
    
    // 计算新文本的位置，避免重叠
    const offset = textElements.length * 50;
    const newElement: TextElement = {
      id: newId,
      text: t('screenshot.appstore.newText'),
      x: 100 + offset,
      y: 100 + offset,
      fontSize: 48,
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      color: '#FFFFFF',
      rotation: 0,
      isDragging: false,
      isSelected: false,
    };
    
    // 取消其他文本的选择状态
    setTextElements(prev => prev.map(el => ({ ...el, isSelected: false })));
    
    // 添加新文本并选中它
    setTextElements(prev => [...prev, newElement]);
    setSelectedTextId(newId);
  };

  const deleteSelectedText = () => {
    if (textElements.length > 1) {
      setTextElements(prev => prev.filter(el => el.id !== selectedTextId));
      setSelectedTextId(textElements[0]?.id || '');
    }
  };

  const selectedText = getSelectedText();

  return (
    <ToolLayout
      categoryId="screenshot"
      toolId="appstore-cover"
      title={t('screenshot.appstore.title')}
      description={`（${t('screenshot.appstore.description')}）`}
    >
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 控制面板 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="w-5 h-5"/>
              {t('screenshot.appstore.settings')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('screenshot.appstore.deviceType')}</Label>
              <Select value={selectedDevice.value} onValueChange={val => {
                const found = DEVICE_SIZES.find(s => s.value === val);
                if (found) setSelectedDevice(found);
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEVICE_SIZES.map(device => (
                    <SelectItem key={device.value} value={device.value}>
                      <div>
                        <div>{device.label}</div>
                        <div className="text-xs text-muted-foreground">{device.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="backgroundColor">{t('screenshot.appstore.backgroundColor')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={coverData.backgroundColor}
                    onChange={(e) => setCoverData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-16 h-10"
                  />
                  <Input
                    value={coverData.backgroundColor}
                    onChange={(e) => setCoverData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    placeholder="#007AFF"
                  />
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="text">{t('screenshot.appstore.text')}</Label>
              <Textarea
                id="text"
                value={selectedText?.text || ''}
                onChange={(e) => updateTextElement(selectedTextId, { text: e.target.value })}
                placeholder={t('screenshot.appstore.textPlaceholder')}
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={addTextElement} variant="outline" className="flex-1">
                <Plus className="w-4 h-4 mr-2"/>
                {t('screenshot.appstore.addText')}
              </Button>
              <Button onClick={deleteSelectedText} variant="outline" className="flex-1" disabled={textElements.length <= 1}>
              <Trash className="w-4 h-4 mr-2"/>
                {t('screenshot.appstore.deleteText')}
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label>{t('screenshot.appstore.fontSize')}: {selectedText?.fontSize || 48}px</Label>
              <Slider
                value={[selectedText?.fontSize || 48]}
                onValueChange={(value) => updateTextElement(selectedTextId, { fontSize: value[0] })}
                min={12}
                max={120}
                step={2}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('screenshot.appstore.rotation')}: {selectedText?.rotation || 0}°</Label>
              <Slider
                value={[selectedText?.rotation || 0]}
                onValueChange={(value) => updateTextElement(selectedTextId, { rotation: value[0] })}
                min={-180}
                max={180}
                step={1}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
             

              <div className="space-y-2">
                <Label htmlFor="textColor">{t('screenshot.appstore.textColor')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="textColor"
                    type="color"
                    value={selectedText?.color || '#FFFFFF'}
                    onChange={(e) => updateTextElement(selectedTextId, { color: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={selectedText?.color || '#FFFFFF'}
                    onChange={(e) => updateTextElement(selectedTextId, { color: e.target.value })}
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
            </div>


            <div className="space-y-2">
              <Label htmlFor="fontFamily">{t('screenshot.appstore.fontFamily')}</Label>
              <Select
                value={selectedText?.fontFamily || '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'}
                onValueChange={(value) => updateTextElement(selectedTextId, { fontFamily: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map(font => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>{font.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backgroundImage">{t('screenshot.appstore.backgroundImage')}</Label>
              <Input
                id="backgroundImage"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChange('backgroundImage', file);
                }}
              />
            </div>

            <Button onClick={handleDownload} className="w-full" disabled={!selectedText?.text}>
              <Download className="w-4 h-4 mr-2"/>
              {t('screenshot.appstore.download')}
            </Button>
          </CardContent>
        </Card>

        {/* 预览 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5"/>
              {t('screenshot.appstore.preview')}
            </CardTitle>
            <CardDescription>
              ({selectedDevice.width}×{selectedDevice.height})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center min-h-[400px] relative">
              <canvas
                ref={previewCanvasRef}
                className="max-w-full max-h-[600px] cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              />
              {textElements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Move className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>{t('screenshot.appstore.startDesign')}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2 text-sm text-muted-foreground text-center space-y-1">
              <p>{t('screenshot.appstore.clickToSelect')}</p>
              <p>{t('screenshot.appstore.useSliders')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 隐藏的 canvas 用于生成图片 */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
    </ToolLayout>
  );
};

export default AppStoreCover; 