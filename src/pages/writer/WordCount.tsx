import { useState, useMemo } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

const WordCount = () => {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('general');
  const [showDebug, setShowDebug] = useState(false);
  const { t } = useTranslation();

  // 统计结果
  const stats = useMemo(() => {
    if (!text) {
      return {
        characters: 0,
        charactersNoSpaces: 0,
        words: 0,
        paragraphs: 0,
        lines: 0,
      };
    }

    // 确保文本是字符串类型，并且不是null或undefined
    const safeText = String(text || '');
    
    const characters = safeText.length;
    const charactersNoSpaces = safeText.replace(/\s/g, '').length;
    const lines = safeText.split('\n').length;
    const paragraphs = safeText.split(/\n\s*\n/).filter(Boolean).length || 1;
    
    // 不同语言的单词计数逻辑
    let words = 0;
    
    switch (language) {
      case 'chinese':
        // 中文计数：连续的中文字符算一个词
        words = (safeText.match(/[\u4e00-\u9fa5]+/g) || []).length;
        // 加上拉丁文字的词数
        words += (safeText.match(/[a-zA-Z0-9]+/g) || []).length;
        break;
        
      case 'japanese':
        // 日文计数：假设日文字符和汉字为单词
        words = (safeText.match(/[\u3040-\u30ff\u4e00-\u9fa5]+/g) || []).length;
        // 加上拉丁文字的词数
        words += (safeText.match(/[a-zA-Z0-9]+/g) || []).length;
        break;
        
      case 'korean':
        // 韩文计数：连续的韩文字符算一个词
        words = (safeText.match(/[\uAC00-\uD7A3]+/g) || []).length;
        // 加上拉丁文字的词数
        words += (safeText.match(/[a-zA-Z0-9]+/g) || []).length;
        break;
        
      case 'general':
      default: {
        // 一般语言：按空格分词，同时处理特殊情况
        // 使用更准确的分词正则表达式，能够处理引号、撇号等特殊情况
        // 例如 I'll 应该算作一个单词，而不是两个
        const wordMatches = safeText.match(/[\w\-'']+/g) || [];
        words = wordMatches.length;
        
        // 在调试模式下显示匹配的单词
        if (showDebug) {
          console.log(t('categories.writer.tools.word-count.debug.tokenArray') + ':', wordMatches);
        }
        break;
      }
    }

    return {
      characters,
      charactersNoSpaces,
      words,
      paragraphs,
      lines,
    };
  }, [text, language, showDebug, t]);

  return (
    <ToolLayout 
      title={t('categories.writer.tools.word-count.title')} 
      description={`（${t('categories.writer.tools.word-count.fullDescription')}）`}
    >
      <div className="space-y-4">
        <div className="flex justify-between mb-2">
          <button 
            onClick={() => setShowDebug(!showDebug)} 
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {showDebug ? t('categories.writer.tools.word-count.hideDebug') : t('categories.writer.tools.word-count.showDebug')}
          </button>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('categories.writer.tools.word-count.languageSelect')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">{t('categories.writer.tools.word-count.languages.general')}</SelectItem>
              <SelectItem value="chinese">{t('categories.writer.tools.word-count.languages.chinese')}</SelectItem>
              <SelectItem value="japanese">{t('categories.writer.tools.word-count.languages.japanese')}</SelectItem>
              <SelectItem value="korean">{t('categories.writer.tools.word-count.languages.korean')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Textarea
          placeholder={t('categories.writer.tools.word-count.placeholder')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[300px]"
        />
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <StatCard title={t('categories.writer.tools.word-count.stats.words')} value={stats.words} />
          <StatCard title={t('categories.writer.tools.word-count.stats.characters')} value={stats.characters} />
          <StatCard title={t('categories.writer.tools.word-count.stats.noSpaces')} value={stats.charactersNoSpaces} />
          <StatCard title={t('categories.writer.tools.word-count.stats.paragraphs')} value={stats.paragraphs} />
          <StatCard title={t('categories.writer.tools.word-count.stats.lines')} value={stats.lines} />
        </div>

        {showDebug && (
          <div className="mt-4 p-4 border rounded bg-gray-50 text-xs font-mono overflow-auto">
            <div>{t('categories.writer.tools.word-count.debug.originalLength')}: {text.length}</div>
            <div>{t('categories.writer.tools.word-count.debug.safeLength')}: {String(text || '').length}</div>
            <div>{t('categories.writer.tools.word-count.debug.firstChars')}: {text.substring(0, 20)}</div>
            <div>{t('categories.writer.tools.word-count.debug.lastChars')}: {text.substring(text.length - 20)}</div>
            <div>{t('categories.writer.tools.word-count.debug.oldTokens')}: {text.trim().split(/\s+/).filter(Boolean).length}</div>
            <div>{t('categories.writer.tools.word-count.debug.newTokens')}: {(text.match(/[\w\-'']+/g) || []).length}</div>
            <div>{t('categories.writer.tools.word-count.debug.tokenArray')}: [{(text.match(/[\w\-'']+/g) || []).map(w => `"${w}"`).join(', ')}]</div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

// 统计数据卡片组件
const StatCard = ({ title, value }: { title: string; value: number }) => {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <div className="text-lg font-semibold">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
      </CardContent>
    </Card>
  );
};

export default WordCount;
