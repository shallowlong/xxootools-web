import React from 'react';
import { useTranslation } from 'react-i18next';

const Privacy: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{t('privacy.title', '隐私政策')}</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">{t('privacy.introduction', '介绍')}</h2>
          <p className="text-muted-foreground">
            {t('privacy.introText', '欢迎使用XTools。我们非常重视您的隐私和数据安全。本隐私政策旨在告知您我们如何处理您使用我们服务时的数据。')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">{t('privacy.dataPolicy', '数据处理政策')}</h2>
          <p className="text-muted-foreground mb-3">
            {t('privacy.noStorage', '我们不会存储您上传或处理的任何文件数据。所有文件处理都在您的浏览器本地进行，数据不会传输到我们的服务器。')}
          </p>
          <p className="text-muted-foreground mb-3">
            {t('privacy.localProcessing', '我们的工具设计为完全在客户端运行，这意味着您的文件内容不会离开您的设备。这确保了您的数据安全和隐私。')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">{t('privacy.analytics', '使用分析')}</h2>
          <p className="text-muted-foreground">
            {t('privacy.analyticsText', '我们可能会收集匿名使用数据，如页面访问和功能使用统计，以帮助我们改进我们的服务。这些数据不包含任何个人身份信息或文件内容。')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">{t('privacy.cookies', 'Cookies')}</h2>
          <p className="text-muted-foreground">
            {t('privacy.cookiesText', '我们可能使用基本的cookie来记住您的语言偏好和主题设置。这些cookie不用于追踪或广告目的。')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">{t('privacy.contact', '联系我们')}</h2>
          <p className="text-muted-foreground">
            {t('privacy.contactText', '如果您对我们的隐私政策有任何疑问或顾虑，请通过我们的网站联系我们。')}
          </p>
        </section>

        <section className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {t('privacy.lastUpdated', '最后更新')}: {new Date().toLocaleDateString()}
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy; 