import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-6 bg-background shrink-0">
      <div className="px-4 md:px-6">
        <div className="text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} XTools. 保留所有权利。</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 