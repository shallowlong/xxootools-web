import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ToolLayout from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/button';
import { Upload, Download, X, Image as ImageIcon, Archive } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface FaviconSize {
  name: string;
  width: number;
  height: number;
  format: string;
}

interface ConvertedFile {
  name: string;
  size: number;
  url: string;
  type: string;
  blob: Blob;
  width: number;
  height: number;
}

const FaviconConverter = () => {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 定义图标尺寸
  const faviconSizes: FaviconSize[] = [
    { name: 'android-chrome-192x192.png', width: 192, height: 192, format: 'png' },
    { name: 'android-chrome-512x512.png', width: 512, height: 512, format: 'png' },
    { name: 'apple-touch-icon.png', width: 180, height: 180, format: 'png' },
    { name: 'favicon-16x16.png', width: 16, height: 16, format: 'png' },
    { name: 'favicon-32x32.png', width: 32, height: 32, format: 'png' },
    { name: 'favicon.ico', width: 32, height: 32, format: 'ico' }
  ];

  // 图片上传后自动转换
  useEffect(() => {
    if (selectedImage) {
      convertToFavicon();
    }
  }, [selectedImage]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        setError(t('faviconConverter.invalidFileType') || 'Invalid file type');
        return;
      }
      
      setSelectedImage(file);
      setError('');

      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        setError(t('faviconConverter.invalidFileType') || 'Invalid file type');
        return;
      }
      
      setSelectedImage(file);
      setError('');

      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setConvertedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const convertToFavicon = async () => {
    if (!selectedImage) return;
    
    setIsConverting(true);
    setError('');
    setConvertedFiles([]);
    
    try {
      const results: ConvertedFile[] = [];
      
      // 为每个尺寸生成图标
      for (const size of faviconSizes) {
        const blob = await createFaviconBlob(selectedImage, size.format, size.width, size.height);
        const url = URL.createObjectURL(blob);
        
        results.push({
          name: size.name,
          size: blob.size,
          url: url,
          type: size.format === 'ico' ? 'image/x-icon' : `image/${size.format}`,
          blob: blob,
          width: size.width,
          height: size.height
        });
      }
      
      setConvertedFiles(results);
    } catch (err) {
      console.error('Favicon conversion error:', err);
      setError(t('faviconConverter.conversionError') || 'Error during conversion');
    } finally {
      setIsConverting(false);
    }
  };
  
  const createFaviconBlob = async (file: File, format: string, width: number, height: number): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              }
            }, format === 'ico' ? 'image/x-icon' : `image/${format}`);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const downloadFile = (file: ConvertedFile) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAllAsZip = async () => {
    if (convertedFiles.length === 0) return;
    
    try {
      const zip = new JSZip();
      
      // 添加所有生成的文件到zip
      convertedFiles.forEach(file => {
        zip.file(file.name, file.blob);
      });
      
      // 生成并下载zip文件
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'favicon-package.zip');
    } catch (err) {
      console.error('Error creating ZIP file:', err);
      setError(t('faviconConverter.zipError') || 'Error creating ZIP file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  return (
    <ToolLayout
      categoryId="favicon"
      toolId="favicon-converter"
      title={t('faviconConverter.title') || 'Favicon Converter'}
      description={`（${t('faviconConverter.description')}）`}
    >
      <div className="space-y-6">
        {/* 图像上传区域 */}
        <div 
          // className={`border-2 border-dashed rounded-lg p-6 text-center ${selectedImage ? 'border-primary' : 'border-muted-foreground/25'}`}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer 
            ${isDragging ? 'border-primary bg-primary/10' : 'hover:border-primary'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {!selectedImage ? (
            <div className="space-y-2">
              <div className="flex justify-center">
                <Upload className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">
                {t('common.clickOrDragToUpload') || 'Drop image to upload'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('faviconConverter.supportedFormats') || 'Supported formats: JPEG, JPG, PNG, WebP, AVIF'}
              </p>
              <input
                id="file-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/avif,.svg,image/svg+xml"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  {t('faviconConverter.selectedImage') || 'Selected Image'}
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={clearImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-center">
                <div className="relative w-32 h-32 overflow-hidden border rounded-md">
                  {previewUrl && (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>
              <div className="text-sm">
                <p><strong>{t('common.fileName') || 'File Name'}:</strong> {selectedImage.name}</p>
                <p><strong>{t('common.fileSize') || 'File Size'}:</strong> {formatFileSize(selectedImage.size)}</p>
              </div>
            </div>
          )}
        </div>

        {/* 转换结果 */}
        {isConverting && (
          <div className="flex justify-center py-8">
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin">
                <svg className="h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p>{t('common.converting') || 'Converting...'}</p>
            </div>
          </div>
        )}

        {convertedFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">
                {t('faviconConverter.conversionResults') || 'Conversion Results'}
              </h3>
              <Button 
                variant="outline" 
                onClick={downloadAllAsZip}
                className="flex items-center space-x-1"
              >
                <Archive className="h-4 w-4 mr-1" />
                <span>{t('imageCompress.downloadAll') || 'Download All as ZIP'}</span>
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3">{t('common.fileInfo') || 'File'}</th>
                    <th className="text-center p-3">{t('common.fileSize') || 'File Size'}</th>
                    <th className="text-right p-3">{t('common.actions') || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {convertedFiles.map((file, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">
                        <div className="flex items-center space-x-3">
                          <div className="bg-muted/30 rounded p-1">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {file.width} x {file.height}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadFile(file)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {t('common.download') || 'Download'}
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

export default FaviconConverter; 