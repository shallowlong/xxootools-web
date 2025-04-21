import { ToolGroupType } from '@/types/tool';

// 热门工具配置
export const POPULAR_TOOLS = [
  { categoryId: 'image', toolId: 'image-compress' },
  { categoryId: 'text', toolId: 'text-diff' },
  { categoryId: 'video', toolId: 'video-compress' },
  { categoryId: 'date', toolId: 'dayjs-utils' },
];

// 最近更新工具配置
export const RECENT_TOOLS = [
  {
    categoryId: 'svg',
    toolId: 'svg-viewer',
    updateDate: '2025-04-15'
  },
  {
    categoryId: 'svg',
    toolId: 'svg-optimizer',
    updateDate: '2025-03-15'
  },
  {
    categoryId: 'image',
    toolId: 'image-mosaic',
    updateDate: '2024-04-15'
  },
  { 
    categoryId: 'image', 
    toolId: 'image-converter',
    updateDate: '2023-04-15' 
  },
  { 
    categoryId: 'audio', 
    toolId: 'audio-converter',
    updateDate: '2023-04-10' 
  },
  { 
    categoryId: 'text', 
    toolId: 'text-converter',
    updateDate: '2023-04-05' 
  },
];

// 工具分组本地化键值
export const GROUP_TITLE_KEYS = {
  [ToolGroupType.FAVORITES]: 'toolGroups.favorites',
  [ToolGroupType.POPULAR]: 'toolGroups.popular',
  [ToolGroupType.RECENT]: 'toolGroups.recent',
}; 