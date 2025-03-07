import React from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { sify, tify } from 'chinese-conv';
import { useTranslation } from 'react-i18next';

const TextConverter = () => {
  const [text, setText] = React.useState('');
  const { t } = useTranslation();

  // 简体转繁体
  const convertToTraditional = () => {
    if (!text) return;
    setText(tify(text));
  };

  // 繁体转简体
  const convertToSimplified = () => {
    if (!text) return;
    setText(sify(text));
  };

  return (
    <ToolLayout
      title={t('textConverter.title')}
      description={`（${t('textConverter.description')}）`}
    >
      <div className="space-y-4">
        <Textarea
          placeholder={t('textConverter.placeholder')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[200px]"
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setText(text.toUpperCase())}>
            {t('textConverter.toUpperCase')}
          </Button>
          <Button onClick={() => setText(text.toLowerCase())}>
            {t('textConverter.toLowerCase')}
          </Button>
          <Button onClick={convertToTraditional}>
            {t('textConverter.toTraditional')}
          </Button>
          <Button onClick={convertToSimplified}>
            {t('textConverter.toSimplified')}
          </Button>
        </div>
      </div>
    </ToolLayout>
  );
};
export default TextConverter;