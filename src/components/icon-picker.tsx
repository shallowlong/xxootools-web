/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactDOM from 'react-dom/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import debounce from 'lodash/debounce';

// 导入图标集
import type { IconifyJSON } from '@iconify/types';
import mdi from '@iconify/json/json/mdi.json';
import heroicons from '@iconify/json/json/heroicons.json';
import ph from '@iconify/json/json/ph.json';
import ri from '@iconify/json/json/ri.json';
import carbon from '@iconify/json/json/carbon.json';
import lucide from '@iconify/json/json/lucide.json';
import tabler from '@iconify/json/json/tabler.json';

// 图标集缓存
const iconSetCache = new Map<string, string[]>();

// 图标集类型定义
interface IconSet {
  id: string;
  name: string;
  prefix: string;
  module: IconifyJSON;
}

// 图标集列表
const iconSets: IconSet[] = [
  { id: 'mdi', name: 'Material Design Icons', prefix: 'mdi', module: mdi as IconifyJSON },
  { id: 'heroicons', name: 'Heroicons', prefix: 'heroicons', module: heroicons as IconifyJSON },
  { id: 'ph', name: 'Phosphor', prefix: 'ph', module: ph as IconifyJSON },
  { id: 'ri', name: 'Remix Icon', prefix: 'ri', module: ri as IconifyJSON },
  { id: 'carbon', name: 'Carbon', prefix: 'carbon', module: carbon as IconifyJSON },
  { id: 'lucide', name: 'Lucide', prefix: 'lucide', module: lucide as IconifyJSON },
  { id: 'tabler', name: 'Tabler', prefix: 'tabler', module: tabler as IconifyJSON },
];

// SVG 转 PNG 工具函数
const svgToPng = async (svg: SVGElement, width: number, height: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    const svgString = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, (width - height) / 2, 0, height, height);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          reject(new Error('Failed to create blob'));
        }
      });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = `data:image/svg+xml;base64,${btoa(svgString)}`;
  });
};

interface IconPickerProps {
  onSelect: (iconUrl: string) => void;
  maxRecentIcons?: number; // 最近使用的图标数量上限
}

export const IconPicker: React.FC<IconPickerProps> = ({ 
  onSelect,
  maxRecentIcons = 12 
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<string>('mdi');
  const [loading, setLoading] = useState(false);
  const [icons, setIcons] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [iconColor, setIconColor] = useState('#000000');
  const [iconSize, setIconSize] = useState<number>(256);
  const [recentIcons, setRecentIcons] = useState<Array<{set: string, name: string}>>(() => {
    const saved = localStorage.getItem('recentIcons');
    return saved ? JSON.parse(saved) : [];
  });
  const [focusedIconIndex, setFocusedIconIndex] = useState<number>(-1);
  const itemsPerPage = 100;

  // 防抖搜索
  const debouncedSearch = useMemo(
    () => debounce((term: string) => {
      setSearchTerm(term);
      setPage(1);
    }, 300),
    []
  );

  // 使用 useMemo 优化过滤和分页
  const filteredIcons = useMemo(() => {
    return searchTerm
      ? icons.filter(icon => icon.toLowerCase().includes(searchTerm.toLowerCase()))
      : icons;
  }, [searchTerm, icons]);

  const paginatedIcons = useMemo(() => {
    return filteredIcons.slice(0, page * itemsPerPage);
  }, [filteredIcons, page, itemsPerPage]);

  const hasMore = paginatedIcons.length < filteredIcons.length;

  // 添加到最近使用
  const addToRecent = useCallback((iconName: string) => {
    setRecentIcons(prev => {
      const newIcon = { set: selectedSet, name: iconName };
      const filtered = prev.filter(icon => 
        !(icon.set === newIcon.set && icon.name === newIcon.name)
      );
      return [newIcon, ...filtered].slice(0, maxRecentIcons);
    });
  }, [selectedSet, maxRecentIcons]);

  const handleIconSelect = useCallback(async (iconName: string) => {
    const fullIconName = `${selectedSet}:${iconName}`;
    setSelectedIcon(fullIconName);
    setLoading(true);
    
    try {
      const tempDiv = document.createElement('div');
      const root = document.createElement('div');
      root.style.width = '512px';
      root.style.height = '512px';
      tempDiv.appendChild(root);
      
      // 渲染图标到 SVG
      const iconComponent = (
        <Icon 
          icon={fullIconName} 
          width={iconSize} 
          height={iconSize} 
          color={iconColor}
        />
      );
      
      const reactRoot = ReactDOM.createRoot(root);
      reactRoot.render(iconComponent);
      
      // 等待图标渲染
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const svg = root.querySelector('svg');
      if (svg) {
        const url = await svgToPng(svg, 512, 512);
        onSelect(url);
        addToRecent(iconName);
      }
      
      reactRoot.unmount();
    } catch (error) {
      console.error('Error loading icon:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSet, iconSize, iconColor, onSelect, addToRecent]);

  // 处理键盘导航
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalIcons = paginatedIcons.length;
    
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        setFocusedIconIndex(prev => 
          prev < totalIcons - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedIconIndex(prev => 
          prev > 0 ? prev - 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIconIndex(prev => {
          const newIndex = prev - 8; // 假设每行8个图标
          return newIndex >= 0 ? newIndex : prev;
        });
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIconIndex(prev => {
          const newIndex = prev + 8; // 假设每行8个图标
          return newIndex < totalIcons ? newIndex : prev;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIconIndex >= 0 && focusedIconIndex < totalIcons) {
          handleIconSelect(paginatedIcons[focusedIconIndex]);
        }
        break;
    }
  }, [focusedIconIndex, paginatedIcons, handleIconSelect]);

  useEffect(() => {
    const loadIconSet = async () => {
      setLoading(true);
      try {
        // 检查缓存
        if (iconSetCache.has(selectedSet)) {
          setIcons(iconSetCache.get(selectedSet) || []);
          setLoading(false);
          return;
        }

        const selectedIconSet = iconSets.find(set => set.id === selectedSet);
        if (!selectedIconSet?.module?.icons) {
          throw new Error('Invalid icon set');
        }

        const iconList = Object.keys(selectedIconSet.module.icons);
        iconSetCache.set(selectedSet, iconList);
        setIcons(iconList);
      } catch (error) {
        console.error('Error loading icon set:', error);
        setIcons([]);
      } finally {
        setLoading(false);
      }
    };

    loadIconSet();
  }, [selectedSet]);

  return (
    <div 
      className="space-y-4"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>图标颜色</Label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={iconColor}
              onChange={(e) => setIconColor(e.target.value)}
              className="flex-1"
            />
            <Input
              type="color"
              value={iconColor}
              onChange={(e) => setIconColor(e.target.value)}
              className="w-12 p-1 h-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>图标大小 (px)</Label>
          <div className="flex gap-2 items-center">
            <Input
              type="text"
              inputMode="numeric"
              value={iconSize}
              onChange={(e) => setIconSize(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground">64-512</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>图标集</Label>
          <Select value={selectedSet} onValueChange={(value) => {
            setSelectedSet(value);
            setSearchTerm('');
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {iconSets.map((set) => (
                <SelectItem key={set.id} value={set.id}>
                  {set.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>搜索图标</Label>
          <Input
            type="text"
            placeholder="搜索图标..."
            value={searchTerm}
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>
      </div>
      {recentIcons.length > 0 && (
        <div className="space-y-2">
          <Label>最近使用</Label>
          <div className="grid grid-cols-8 gap-2 p-2 border rounded-md">
            {recentIcons.map((icon, index) => (
              <button
                key={`${icon.set}-${icon.name}-${index}`}
                className={`p-2 hover:bg-gray-100 rounded-md flex items-center justify-center ${
                  selectedIcon === `${icon.set}:${icon.name}` ? 'bg-gray-100' : ''
                }`}
                onClick={() => handleIconSelect(icon.name)}
                title={icon.name}
              >
                <Icon
                  icon={`${icon.set}:${icon.name}`}
                  width={24}
                  height={24}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <ScrollArea className="h-[400px] border rounded-md p-4">
        <div className="grid grid-cols-8 gap-2">
          {paginatedIcons.map((icon, index) => (
            <button
              key={icon}
              className={`p-2 hover:bg-gray-100 rounded-md flex items-center justify-center ${
                selectedIcon === `${selectedSet}:${icon}` ? 'bg-gray-100' : ''
              } ${focusedIconIndex === index ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => handleIconSelect(icon)}
              title={icon}
            >
              <Icon
                icon={`${selectedSet}:${icon}`}
                width={24}
                height={24}
              />
            </button>
          ))}
        </div>
        {hasMore && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={() => setPage(prev => prev + 1)}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              加载更多
            </Button>
          </div>
        )}
      </ScrollArea>
      {selectedIcon && (
        <div className="p-4 border rounded-md">
          <Label>预览</Label>
          <div className="mt-2 flex items-center justify-center bg-gray-50 rounded-md" style={{ minHeight: '100px' }}>
            <Icon
              icon={selectedIcon}
              width={iconSize}
              height={iconSize}
              color={iconColor}
            />
          </div>
          <div className="mt-2 text-sm text-muted-foreground text-center">
            {iconSize} x {iconSize} px
          </div>
        </div>
      )}
      <div className="text-sm text-muted-foreground text-center">
        {filteredIcons.length > 0 && `共 ${filteredIcons.length} 个图标`}
      </div>
    </div>
  );
}; 