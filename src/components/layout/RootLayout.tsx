import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { ModeToggle } from '@/components/ui/mode-toggle';

const RootLayout: React.FC = () => {
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b z-10 bg-background shrink-0">
        <div className="px-4 flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="relative w-10 h-10 mr-3 overflow-hidden rounded-full shadow-sm transition-transform group-hover:scale-105">
                <img src="/xtools-logo.svg" alt="XTools Logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300 group-hover:from-blue-700 group-hover:to-cyan-600">XTools</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Button variant="outline">English</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-auto">
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