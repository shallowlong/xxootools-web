import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ToolActions from './ToolActions';
import { Helmet } from 'react-helmet-async';
import { t } from 'i18next';

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
    <>
    <Helmet>
      <title>{t('common.brandName')} - {title}</title>
      <meta name="description" content={description} />
    </Helmet>
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
    </>
  );
};

export default ToolLayout;