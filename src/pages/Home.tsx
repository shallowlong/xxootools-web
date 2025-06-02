import { Trans } from 'react-i18next';
import { TOOL_CATEGORY } from '@/constants/category';
import { POPULAR_TOOLS, RECENT_TOOLS, GROUP_TITLE_KEYS } from '@/constants/featured-tools';
import { useEffect, useState } from 'react';
import { FavoriteTool, Tool, ToolGroupType } from '@/types/tool';
import { getFavoriteTools } from '@/services/favorites';
import ToolGroup from '@/components/ToolGroup';

const Home = () => {
  const [favoriteTools, setFavoriteTools] = useState<FavoriteTool[]>([]);
  
  // 监听收藏变化
  useEffect(() => {
    setFavoriteTools(getFavoriteTools());
    
    const handleStorageChange = () => {
      setFavoriteTools(getFavoriteTools());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // 查找工具对象
  const findTool = (categoryId: string, toolId: string): { tool: Tool; categoryId: string } | null => {
    const category = TOOL_CATEGORY.find(cat => cat.id === categoryId);
    if (!category) return null;
    
    const tool = category.tools.find(t => t.id === toolId);
    if (!tool) return null;
    
    return { tool, categoryId };
  };
  
  // 获取收藏工具列表
  const favoriteToolsList = favoriteTools
    .map(fav => findTool(fav.categoryId, fav.toolId))
    .filter(Boolean) as Array<{ tool: Tool; categoryId: string }>;
  
  // 获取热门工具列表
  const popularToolsList = POPULAR_TOOLS
    .map(item => findTool(item.categoryId, item.toolId))
    .filter(Boolean) as Array<{ tool: Tool; categoryId: string }>;
  
  // 获取最新工具列表
  const recentToolsList = RECENT_TOOLS
    .map(item => findTool(item.categoryId, item.toolId))
    .filter(Boolean) as Array<{ tool: Tool; categoryId: string }>;
  
  return (
    <div>
      <h1 className="text-3xl text-center font-bold mb-10">
      <iframe style={{ margin: '0px auto 10px' }} src="https://www.launchgns.com/badge?id=185876ca-514e-4527-b734-1257e55d4ac6&style=default&theme=light&period=daily&showRank=false&showScore=true&target=_blank" width="300px" height="60px" frameBorder="0" scrolling="no"></iframe>
        <Trans
          i18nKey="welcome"
          components={{ 
            span: <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300 group-hover:from-blue-700 group-hover:to-cyan-600" />,
            b: <b className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300 group-hover:from-blue-700 group-hover:to-cyan-600" />,
          }}
        />
        
      </h1>
      
      {/* 收藏工具 */}
      <ToolGroup
        title={GROUP_TITLE_KEYS[ToolGroupType.FAVORITES]}
        tools={favoriteToolsList}
        type={ToolGroupType.FAVORITES}
      />
      
      {/* 热门工具 */}
      <ToolGroup
        title={GROUP_TITLE_KEYS[ToolGroupType.POPULAR]}
        tools={popularToolsList}
        type={ToolGroupType.POPULAR}
      />
      
      {/* 最新工具 */}
      <ToolGroup
        title={GROUP_TITLE_KEYS[ToolGroupType.RECENT]}
        tools={recentToolsList}
        type={ToolGroupType.RECENT}
      />
      
    </div>
  );
};

export default Home;
