import React from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const TextDiff = () => {
  const [text1, setText1] = React.useState('');
  const [text2, setText2] = React.useState('');
  const [diff, setDiff] = React.useState<string[]>([]);

  const compareDiff = () => {
    // 简单的行比较
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    
    const result: string[] = [];
    
    const maxLines = Math.max(lines1.length, lines2.length);
    
    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';
      
      if (line1 === line2) {
        result.push(`  ${line1}`);
      } else {
        result.push(`- ${line1}`);
        result.push(`+ ${line2}`);
      }
    }
    
    setDiff(result);
  };

  return (
    <ToolLayout
      title="文本对比"
      description="对比两段文本的差异"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Textarea
          placeholder="请输入第一段文本..."
          value={text1}
          onChange={(e) => setText1(e.target.value)}
          className="min-h-[200px]"
        />
        <Textarea
          placeholder="请输入第二段文本..."
          value={text2}
          onChange={(e) => setText2(e.target.value)}
          className="min-h-[200px]"
        />
      </div>
      
      <Button onClick={compareDiff} className="mb-4">
        比较差异
      </Button>
      
      {diff.length > 0 && (
        <div className="border rounded-md p-4 font-mono text-sm whitespace-pre">
          {diff.map((line, index) => (
            <div 
              key={index} 
              className={
                line.startsWith('- ') 
                  ? 'bg-red-100 dark:bg-red-950/30' 
                  : line.startsWith('+ ') 
                    ? 'bg-green-100 dark:bg-green-950/30' 
                    : ''
              }
            >
              {line}
            </div>
          ))}
        </div>
      )}
    </ToolLayout>
  );
};

export default TextDiff; 