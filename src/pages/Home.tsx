import { Link } from 'react-router-dom';
import { TOOL_CATEGORY } from '@/constants/category';
import * as LucideIcons from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

const Home = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1 className="text-3xl text-center font-bold mb-6">
        
        <Trans
          i18nKey="welcome"
          components={{ 
            span: <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300 group-hover:from-blue-700 group-hover:to-cyan-600" />,
            b: <b className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300 group-hover:from-blue-700 group-hover:to-cyan-600" />,
          }}
        />
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TOOL_CATEGORY.flatMap(category => 
          category.tools.map(tool => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const IconComponent = (LucideIcons as any)[tool.icon] || LucideIcons.FileText;
            return (
              <Link 
                key={tool.id}
                to={tool.path}
                className="block p-4 border rounded-lg hover:border-primary transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold">{t(`categories.${category.id}.tools.${tool.id}.name`)}</h2>
                </div>
                <p className="text-muted-foreground text-sm">{t(`categories.${category.id}.tools.${tool.id}.description`)}</p>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Home;
