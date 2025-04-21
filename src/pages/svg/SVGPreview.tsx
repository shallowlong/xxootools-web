import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ToolLayout from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';

const SVGPreview = () => {
  const { t } = useTranslation();
  const [svgCode, setSvgCode] = useState<string>('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="80" fill="#6366f1" /></svg>');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    updatePreview();
  }, []);

  const updatePreview = () => {
    try {
      // 验证SVG代码
      if (!svgCode.trim() || !svgCode.includes('<svg')) {
        setError(t('svgPreview.invalidSvgCode'));
        setPreviewUrl('');
        return;
      }

      // 创建Blob并生成预览URL
      const blob = new Blob([svgCode], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      // 清除旧URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      setPreviewUrl(url);
      setError('');
    } catch (err) {
      console.error('SVG预览错误:', err);
      setError(t('svgPreview.previewError'));
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSvgCode(e.target.value);
  };

  const handleDownload = () => {
    if (!svgCode || error) return;
    
    try {
      const blob = new Blob([svgCode], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'download.svg';
      document.body.appendChild(a);
      a.click();
      
      // 清理
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('下载SVG错误:', err);
    }
  };

  const handleCopy = () => {
    if (!svgCode) return;
    
    navigator.clipboard.writeText(svgCode)
      .then(() => {
        // 可以添加复制成功提示
      })
      .catch(err => {
        console.error('复制SVG代码错误:', err);
      });
  };
  
  return (
    <ToolLayout
      categoryId="svg"
      toolId="svg-preview"
      title={t('svgPreview.title')}
      description={`（${t('svgPreview.description')}）`}
    >
      <div className="space-y-4 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 左侧SVG代码输入 */}
          <div className="flex flex-col border rounded-lg overflow-auto min-h-[calc(100vh-350px)]">
            <div className="bg-muted/50 p-2 flex justify-between items-center">
              <span className="text-sm font-medium">{t('svgPreview.svgCode')}</span>
              <Button 
                onClick={handleCopy}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <textarea
              className="flex-1 p-3 font-mono text-sm resize-none outline-none"
              value={svgCode}
              onChange={handleCodeChange}
              spellCheck="false"
              placeholder={t('svgPreview.pasteSvgHere')}
            />
            <div className="bg-muted/30 p-2 flex justify-between items-center">
              <div>
                {error && <span className="text-xs text-destructive">{error}</span>}
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={updatePreview}
                  size="sm"
                >
                  {t('svgPreview.preview')}
                </Button>
              </div>
            </div>
          </div>
          
          {/* 右侧SVG预览 */}
          <div className="flex flex-col border rounded-lg overflow-auto min-h-[calc(100vh-350px)]">
            <div className="bg-muted/50 p-2 flex justify-between items-center">
              <span className="text-sm font-medium">{t('svgPreview.svgPreview')}</span>
              <Button 
                onClick={handleDownload}
                variant="ghost"
                size="sm"
                disabled={!previewUrl || !!error}
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 flex items-center justify-center bg-[url('/grid-bg.svg')] overflow-auto p-4">
              {previewUrl ? (
                <div className="shadow-sm">
                  <img 
                    src={previewUrl} 
                    alt="SVG Preview" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  {error || t('svgPreview.noPreview')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default SVGPreview; 