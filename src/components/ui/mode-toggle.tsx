import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/theme-provider';
import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

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
      title={theme === 'light' ? t('common.toggleToDark') : t('common.toggleToLight')}
    >
      {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      <span className="sr-only">
        {theme === 'light' ? t('common.toggleToDark') : t('common.toggleToLight')}
      </span>
    </Button>
  );
} 