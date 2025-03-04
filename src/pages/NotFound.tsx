import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-5xl font-bold mb-6">404</h1>
      <p className="text-xl text-muted-foreground mb-8">页面未找到</p>
      <Button asChild>
        <Link to="/">返回首页</Link>
      </Button>
    </div>
  );
};

export default NotFound; 