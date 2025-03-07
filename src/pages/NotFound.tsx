
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-5xl font-bold mb-6">404</h1>
      <p className="text-xl text-muted-foreground mb-8">{t('common.notFound')}</p>
      <Button asChild>
        <Link to="/">{t('common.backToHome')}</Link>
      </Button>
    </div>
  );
};

export default NotFound; 