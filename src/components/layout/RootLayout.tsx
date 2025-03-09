import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { ModeToggle } from '@/components/ui/mode-toggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { Github } from 'lucide-react';

const RootLayout: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b z-10 bg-background shrink-0">
        <div className="px-4 flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="relative w-10 h-10 mr-3 overflow-hidden rounded-full shadow-sm transition-transform group-hover:scale-105">
                <img src="/logo.png" alt={t('common.logoAlt')} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300 group-hover:from-blue-700 group-hover:to-cyan-600">XTools</span>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
          <a href="https://www.producthunt.com/posts/xtools?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-xtools" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=939919&theme=light&t=1741521594354" alt="XTools - a&#0032;free&#0044;&#0032;open&#0045;source&#0044;&#0032;and&#0032;data&#0045;secure&#0032;toolbox&#0046; | Product Hunt" style={{width: "168px", height: "34px"}} /></a>
            <a
              href="https://github.com/Go7hic/xxootools-web"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              title={t('common.viewOnGithub')}
            >
              <Github />
            </a>
            <ModeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-auto">
          <main className="flex-1">
            <div className="p-6">
              <Outlet />
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default RootLayout;