import { useTranslation } from 'react-i18next';
import { Tool, ToolGroupType } from '@/types/tool';
import ToolCard from './ToolCard';

interface ToolGroupProps {
  title: string;
  tools: Array<{ 
    tool: Tool; 
    categoryId: string;
  }>;
  type: ToolGroupType;
}

const ToolGroup = ({ title, tools, type }: ToolGroupProps) => {
  const { t } = useTranslation();
  
  // 如果没有工具，不显示这个分组
  if (tools.length === 0 && type !== ToolGroupType.CATEGORY) {
    return null;
  }
  
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
          {t(title)}
        </h2>
      </div>
      
      {tools.length === 0 ? (
        <div className="p-6 border rounded-lg bg-gray-50 text-center">
          {type === ToolGroupType.FAVORITES 
            ? t('toolGroups.noFavorites') 
            : t('toolGroups.noTools')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map(({ tool, categoryId }) => (
            <ToolCard 
              key={`${categoryId}-${tool.id}`} 
              tool={tool} 
              categoryId={categoryId} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ToolGroup; 