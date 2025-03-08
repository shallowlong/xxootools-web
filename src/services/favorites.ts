import { FavoriteTool } from '@/types/tool';

export const STORAGE_KEY = 'xxootools-favorites';

// 获取所有收藏的工具
export const getFavoriteTools = (): FavoriteTool[] => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : [];
  } catch (error) {
    console.error('Failed to load favorite tools', error);
    return [];
  }
};

// 添加工具到收藏
export const addToFavorites = (categoryId: string, toolId: string): FavoriteTool[] => {
  const favorites = getFavoriteTools();
  
  // 检查是否已经收藏
  const isAlreadyFavorite = favorites.some(
    fav => fav.categoryId === categoryId && fav.toolId === toolId
  );
  
  if (!isAlreadyFavorite) {
    const newFavorites = [
      ...favorites,
      {
        toolId,
        categoryId,
        addedDate: new Date().toISOString()
      }
    ];
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
    return newFavorites;
  }
  
  return favorites;
};

// 从收藏中移除工具
export const removeFromFavorites = (categoryId: string, toolId: string): FavoriteTool[] => {
  const favorites = getFavoriteTools();
  const newFavorites = favorites.filter(
    fav => !(fav.categoryId === categoryId && fav.toolId === toolId)
  );
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
  return newFavorites;
};

// 检查工具是否已收藏
export const isFavorite = (categoryId: string, toolId: string): boolean => {
  const favorites = getFavoriteTools();
  return favorites.some(
    fav => fav.categoryId === categoryId && fav.toolId === toolId
  );
}; 