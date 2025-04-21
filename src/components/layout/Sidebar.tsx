import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search, ChevronRight, ChevronDown, Image, FileVideo, FileAudio, FileType, FolderSync, FileCode, Hash, Database, Gauge, FolderKanban, Pencil, Clock } from 'lucide-react';
import { TOOL_CATEGORY } from '@/constants/category';
import { useTranslation } from 'react-i18next';

// 分类图标和颜色映射
const categoryIconMap: Record<string, { icon: React.ElementType, color: string }> = {
  text: { icon: FileCode, color: '#3B82F6' },    // 蓝色
  image: { icon: Image, color: '#10B981' },     // 绿色
  video: { icon: FileVideo, color: '#F59E0B' },  // 琥珀色
  audio: { icon: FileAudio, color: '#8B5CF6' },  // 紫色
  date: { icon: Clock, color: '#F43F5E' },       // 红粉色
  file: { icon: FileType, color: '#EC4899' },    // 粉色
  dev: { icon: Hash, color: '#EF4444' },         // 红色
  data: { icon: Database, color: '#6366F1' },    // 靛蓝色
  util: { icon: Gauge, color: '#0EA5E9' },        // 天蓝色
  writer: { icon: Pencil, color: '#0EA5E9' },     // 天蓝色
  svg: { icon: FolderSync, color: '#0EA5E9' }     // 天蓝色
};

// 默认图标和颜色
const defaultCategoryIcon = { icon: FolderKanban, color: '#6B7280' }; // 灰色

const Sidebar = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});

  // 初始化时设置所有分类默认展开
  React.useEffect(() => {
    const initialExpanded: {[key: string]: boolean} = {};
    TOOL_CATEGORY.forEach(category => {
      initialExpanded[category.id] = true;
    });
    setExpandedCategories(initialExpanded);
  }, []);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const filteredCategories = TOOL_CATEGORY.map(category => ({
    ...category,
    tools: category.tools.filter(tool => 
      t(`categories.${category.id}.tools.${tool.id}.name`).toLowerCase().includes(search.toLowerCase()) ||
      t(`categories.${category.id}.tools.${tool.id}.description`).toLowerCase().includes(search.toLowerCase())
    )
  })).filter(category => category.tools.length > 0);

  return (
    <div className="w-60 border-r h-screen flex flex-col">
      {/* Search */}
      <div className="p-4 border-b shrink-0" style={{ borderColor: '#e4e4e75c' }}>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`${t('common.search')}...`}
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredCategories.map((category) => {
            // 获取分类图标和颜色，如果没有设置则使用默认值
            const { icon: CategoryIcon, color } = categoryIconMap[category.id] || defaultCategoryIcon;
            
            return (
              <div key={category.id} className="mb-4">
                <div 
                  className="flex items-center justify-between cursor-pointer py-2 rounded-md hover:bg-secondary/30 px-2"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center gap-2">
                    <CategoryIcon className="h-5 w-5" style={{ color }} />
                    <h2 className="text-sm font-semibold">{t(`categories.${category.id}.name`)}</h2>
                  </div>
                  {expandedCategories[category.id] ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                
                {expandedCategories[category.id] && (
                  <div className="ml-2 space-y-1 border-l pl-2" style={{ borderColor: '#e4e4e75c' }}>
                    {category.tools.map((tool) => (
                      <NavLink
                        key={tool.id}
                        to={tool.path}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          )
                        }
                      >
                        <span>{t(`categories.${category.id}.tools.${tool.id}.name`)}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Sidebar;