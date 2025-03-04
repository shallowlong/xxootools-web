import React from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileVideo } from 'lucide-react';

const VideoCompress = () => {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };
  
  return (
    <ToolLayout
      title="视频压缩"
      description="压缩视频文件大小"
    >
      <div className="space-y-6">
        <div 
          className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input
            id="file-upload"
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">点击或拖拽上传视频</h3>
          <p className="text-sm text-muted-foreground">支持 MP4, MOV, AVI 格式</p>
        </div>
        
        {selectedFile && (
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">视频信息</h3>
            
            <div className="flex items-center gap-4 p-4 bg-muted rounded-md">
              <FileVideo className="h-10 w-10 text-primary" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  大小: {selectedFile.size / 1024 < 1024 
                    ? `${(selectedFile.size / 1024).toFixed(2)} KB` 
                    : `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`}
                </p>
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">压缩质量</label>
                  <select className="w-full p-2 rounded-md border">
                    <option value="high">高质量 (较大文件)</option>
                    <option value="medium" selected>中等质量</option>
                    <option value="low">低质量 (较小文件)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">输出格式</label>
                  <select className="w-full p-2 rounded-md border">
                    <option value="mp4">MP4</option>
                    <option value="webm">WebM</option>
                  </select>
                </div>
              </div>
              
              <Button className="w-full">
                压缩视频
              </Button>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default VideoCompress; 