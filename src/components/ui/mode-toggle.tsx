import React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/theme-provider';
import { Moon, Sun } from 'lucide-react';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
    >
      {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      <span className="sr-only">
        {theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
      </span>
    </Button>
  );
} 