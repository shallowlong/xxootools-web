import { Link } from 'react-router-dom';
import { Tool } from '@/types/tool';
import * as LucideIcons from 'lucide-react';
import { useTranslation } from 'react-i18next';

// 导入分类图标和颜色映射
const categoryIconMap: Record<string, { icon: React.ElementType, color: string }> = {
  text: { icon: LucideIcons.FileCode, color: '#3B82F6' },    // 蓝色
  image: { icon: LucideIcons.Image, color: '#10B981' },     // 绿色
  video: { icon: LucideIcons.FileVideo, color: '#F59E0B' },  // 琥珀色
  audio: { icon: LucideIcons.FileAudio, color: '#8B5CF6' },  // 紫色
  date: { icon: LucideIcons.Clock, color: '#F43F5E' },       // 红粉色
  file: { icon: LucideIcons.FileType, color: '#EC4899' },    // 粉色
  dev: { icon: LucideIcons.Hash, color: '#EF4444' },         // 红色
  data: { icon: LucideIcons.Database, color: '#6366F1' },    // 靛蓝色
  util: { icon: LucideIcons.Gauge, color: '#0EA5E9' },        // 天蓝色
  writer: { icon: LucideIcons.Pencil, color: '#0EA5E9' },        // 天蓝色
  svg: { icon: LucideIcons.FileText, color: '#0EA5E9' },    // 天蓝色
  favicon: { icon: LucideIcons.Globe, color: '#D946EF' }      // 紫色
};

// 默认图标和颜色
const defaultCategoryIcon = { color: '#6B7280' }; // 灰色

interface ToolCardProps {
  tool: Tool;
  categoryId: string;
}

const ToolCard = ({ tool, categoryId }: ToolCardProps) => {
  const { t } = useTranslation();
  
  // 获取图标组件
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons as any)[tool.icon] || LucideIcons.FileText;
  
  // 获取分类对应的颜色
  const categoryColor = (categoryIconMap[categoryId] || defaultCategoryIcon).color;

  return (
    <Link 
      to={tool.path}
      className="block p-4 border rounded-lg hover:border-primary transition-colors relative group"
    >
      <div className="flex items-center gap-2 mb-2">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ 
            backgroundColor: `${categoryColor}10`,
            color: categoryColor
          }}
        >
          <IconComponent className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold">
          {t(`categories.${categoryId}.tools.${tool.id}.name`)}
        </h2>
      </div>
      
      <p className="text-sm text-gray-600 mt-1">
        {t(`categories.${categoryId}.tools.${tool.id}.description`)}
      </p>
    </Link>
  );
};

export default ToolCard; 