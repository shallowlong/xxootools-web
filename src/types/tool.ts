export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  popularity?: number; // 用于标记工具的受欢迎程度
  updateDate?: string; // 用于标记工具的更新日期
}

export interface ToolCategory {
  id: string;
  name: string;
  tools: Tool[];
}

// 用户收藏的工具
export interface FavoriteTool {
  toolId: string;
  categoryId: string;
  addedDate: string;
}

// 首页展示的工具分组
export enum ToolGroupType {
  FAVORITES = 'favorites',
  POPULAR = 'popular',
  RECENT = 'recent',
  CATEGORY = 'category'
}

export interface ToolGroup {
  type: ToolGroupType;
  title: string;
  tools: Tool[];
}