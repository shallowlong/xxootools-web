import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ToolActions from './ToolActions';

interface ToolLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  categoryId: string;
  toolId: string;
}

const ToolLayout: React.FC<ToolLayoutProps> = ({
  title,
  description,
  children,
  categoryId,
  toolId
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
        <ToolActions toolName={title} toolId={toolId} categoryId={categoryId} />
      </CardContent>
    </Card>
  );
};

export default ToolLayout;