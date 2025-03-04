import React from 'react';
import { Link } from 'react-router-dom';
import { toolCategories } from '@/data/tool';
import * as LucideIcons from 'lucide-react';

const Home = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">欢迎使用工具箱</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {toolCategories.flatMap(category => 
          category.tools.map(tool => {
            const IconComponent = LucideIcons[tool.icon] || LucideIcons.FileText;
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
                  <h2 className="text-lg font-semibold">{tool.name}</h2>
                </div>
                <p className="text-muted-foreground text-sm">{tool.description}</p>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Home;
