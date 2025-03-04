import React from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';

const ImageCompress = () => {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // 创建预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <ToolLayout
      title="图片压缩"
      description="压缩图片文件大小"
    >
      <div className="space-y-6">
        <div 
          className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">点击或拖拽上传图片</h3>
          <p className="text-sm text-muted-foreground">支持 JPG, PNG, WebP 格式</p>
        </div>
        
        {preview && (
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">图片预览</h3>
            <div className="aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
              <img 
                src={preview} 
                alt="Preview" 
                className="max-w-full max-h-full object-contain" 
              />
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                文件名: {selectedFile?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                大小: {(selectedFile?.size || 0) / 1024 < 1024 
                  ? `${((selectedFile?.size || 0) / 1024).toFixed(2)} KB` 
                  : `${((selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB`}
              </p>
            </div>
            <Button className="mt-4">
              压缩图片
            </Button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default ImageCompress; 