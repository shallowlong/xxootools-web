import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search, ChevronRight, ChevronDown, FileText, Image, FileVideo, FileAudio } from 'lucide-react';
import { toolCategories } from '@/data/tool';

// 图标映射
const iconMap = {
  FileText: FileText,
  Image: Image,
  FileVideo: FileVideo,
  FileAudio: FileAudio
};

const Sidebar = () => {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});

  // 初始化时设置所有分类默认展开
  React.useEffect(() => {
    const initialExpanded: {[key: string]: boolean} = {};
    toolCategories.forEach(category => {
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

  const filteredCategories = toolCategories.map(category => ({
    ...category,
    tools: category.tools.filter(tool => 
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(category => category.tools.length > 0);

  const getIcon = (iconName: string) => {
    return iconMap[iconName as keyof typeof iconMap] || FileText;
  };

  return (
    <div className="w-64 border-r h-screen flex flex-col">
      {/* Search */}
      <div className="p-4 border-b shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索工具..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredCategories.map((category) => (
            <div key={category.id} className="mb-4">
              <div 
                className="flex items-center justify-between cursor-pointer py-2"
                onClick={() => toggleCategory(category.id)}
              >
                <h2 className="text-sm font-semibold">{category.name}</h2>
                {expandedCategories[category.id] ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              
              {expandedCategories[category.id] && (
                <div className="ml-2 space-y-1 border-l pl-2">
                  {category.tools.map((tool) => {
                    const Icon = getIcon(tool.icon);
                    return (
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
                        <Icon className="h-4 w-4" />
                        <span>{tool.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Sidebar;