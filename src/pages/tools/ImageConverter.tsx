import React from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ImageConverter = () => {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [format, setFormat] = React.useState('webp');
  
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
      title="图片格式转换"
      description="转换图片格式"
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
          <p className="text-sm text-muted-foreground">支持 JPG, PNG, WebP, GIF 格式</p>
        </div>
        
        {preview && (
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">图片设置</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="max-w-full max-h-full object-contain" 
                  />
                </div>
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    文件名: {selectedFile?.name}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">目标格式</label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择格式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webp">WebP</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpg">JPG</SelectItem>
                      <SelectItem value="gif">GIF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button className="w-full">
                  转换图片
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default ImageConverter; 