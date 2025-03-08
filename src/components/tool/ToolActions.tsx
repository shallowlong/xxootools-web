import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share, Heart, HeartOff } from 'lucide-react';

import { toast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { addToFavorites, isFavorite, removeFromFavorites } from '@/services/favorites';

interface ToolActionsProps {
  toolName: string;
  categoryId: string;
  toolId: string;
}

const ToolActions: React.FC<ToolActionsProps> = ({ categoryId, toolId, toolName }) => {
  const { t } = useTranslation();
  const [isFavorited, setIsFavorited] = useState(false);
  
  // 在组件加载时检查工具是否已被收藏
  // useEffect(() => {
  //   const checkFavoriteStatus = () => {
  //     const favorites = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  //     setIsFavorited(favorites.includes(location.pathname));
  //   };
    
  //   checkFavoriteStatus();
  // }, [location.pathname]);
  
  useEffect(() => {
    setIsFavorited(isFavorite(categoryId, toolId));
  }, [categoryId, toolId]);
  
  // 分享功能
  const handleShare = () => {
    // 如果浏览器支持原生分享API，则保留此选项
    if (navigator.share) {
      try {
        navigator.share({
          title: toolName,
          url: window.location.href
        }).catch(error => {
          console.error('分享失败:', error);
          // 如果原生分享失败，回退到社交媒体分享下拉菜单
          document.getElementById('share-dropdown-trigger')?.click();
        });
      } catch (error) {
        console.error('分享失败:', error);
        // 如果原生分享失败，回退到社交媒体分享下拉菜单
        document.getElementById('share-dropdown-trigger')?.click();
      }
    } else {
      // 如果不支持原生分享，直接打开下拉菜单
      document.getElementById('share-dropdown-trigger')?.click();
    }
  };
  
  // 收藏功能
  const handleFavorite = () => {
    if (isFavorited) {
      // 移除收藏
      // const index = favorites.indexOf(location.pathname);
      // if (index > -1) {
      //   favorites.splice(index, 1);
      // }
      // localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      removeFromFavorites(categoryId, toolId);
      setIsFavorited(false);
      
      toast({
        title: t('favorite.removed'),
        description: t('favorite.removedDesc'),
        duration: 2000,
      });
      
    } else {
      // 添加收藏
      addToFavorites(categoryId, toolId);
      setIsFavorited(true);
      toast({
        title: t('favorite.added'),
        description: t('favorite.addedDesc'),
        duration: 2000,
      });
    }
  };
  
  return (
    <div className="flex justify-end gap-2 mt-4 pt-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button id="share-dropdown-trigger" variant="outline" size="sm" onClick={handleShare}>
            <Share className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => {
            const url = window.location.href;
            navigator.clipboard.writeText(url)
              .then(() => {
                toast({
                  title: t('share.linkCopied'),
                  description: t('share.linkCopiedDesc'),
                  duration: 2000,
                });
              })
              .catch(err => {
                console.error('无法复制链接:', err);
                toast({
                  title: t('share.copyFailed'),
                  description: t('share.copyFailedDesc'),
                  variant: 'destructive',
                  duration: 2000,
                });
              });
          }}>
            Copy Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            const url = window.location.href;
            const title = encodeURIComponent(toolName);
            const encodedUrl = encodeURIComponent(url);
            window.open(`https://twitter.com/intent/tweet?text=${title}&url=${encodedUrl}`, '_blank', 'width=600,height=400');
          }}>
            Twitter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            const url = window.location.href;
            const encodedUrl = encodeURIComponent(url);
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank', 'width=600,height=400');
          }}>
            Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            const url = window.location.href;
            const title = encodeURIComponent(toolName);
            const encodedUrl = encodeURIComponent(url);
            window.open(`https://service.weibo.com/share/share.php?url=${encodedUrl}&title=${title}`, '_blank', 'width=600,height=400');
          }}>
            Weibo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleFavorite}
        className={isFavorited ? "bg-primary/10" : ""}
      >
        {isFavorited ? (
          <HeartOff className="w-4 h-4" />
        ) : (
          <Heart className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};

export default ToolActions; 