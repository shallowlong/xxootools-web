import React from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const TextDiff = () => {
  const { t } = useTranslation();
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
      title={t('textDiff.title')}
      description={`（${t('textDiff.description')}）`}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Textarea
          placeholder={t('textDiff.firstTextPlaceholder')}
          value={text1}
          onChange={(e) => setText1(e.target.value)}
          className="min-h-[200px]"
        />
        <Textarea
          placeholder={t('textDiff.secondTextPlaceholder')}
          value={text2}
          onChange={(e) => setText2(e.target.value)}
          className="min-h-[200px]"
        />
      </div>
      
      <Button onClick={compareDiff} className="mb-4">
        {t('textDiff.compareButton')}
      </Button>
      
      {diff.length > 0 && (
        <div className="border rounded-md p-4 font-mono text-sm overflow-x-auto">
          {diff.map((line, index) => (
            <div 
              key={index} 
              className={
                line.startsWith('- ') 
                  ? 'bg-red-100 dark:bg-red-950/30 whitespace-pre-wrap break-words' 
                  : line.startsWith('+ ') 
                    ? 'bg-green-100 dark:bg-green-950/30 whitespace-pre-wrap break-words' 
                    : 'whitespace-pre-wrap break-words'
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