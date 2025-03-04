import React from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const TextConverter = () => {
  const [text, setText] = React.useState('');

  return (
    <ToolLayout
      title="文本转换"
      description="转换文本的大小写、简繁体等"
    >
      <div className="space-y-4">
        <Textarea
          placeholder="请输入要转换的文本..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[200px]"
        />
        <div className="flex gap-2">
          <Button onClick={() => setText(text.toUpperCase())}>
            转大写
          </Button>
          <Button onClick={() => setText(text.toLowerCase())}>
            转小写
          </Button>
        </div>
      </div>
    </ToolLayout>
  );
};
export default TextConverter;