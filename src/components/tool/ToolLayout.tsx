import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ToolLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const ToolLayout: React.FC<ToolLayoutProps> = ({
  title,
  description,
  children
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

export default ToolLayout;