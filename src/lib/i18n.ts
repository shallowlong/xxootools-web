import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入翻译资源
import translationEN from '../locales/en/translation.json';
import translationZH from '../locales/zh/translation.json';
import translationZHTW from '../locales/zh-TW/translation.json';
import translationJA from '../locales/ja/translation.json';
import translationDE from '../locales/de/translation.json';
import translationKO from '../locales/ko/translation.json';

// 资源文件
const resources = {
  en: {
    translation: translationEN
  },
  zh: {
    translation: translationZH
  },
  'zh-TW': {
    translation: translationZHTW
  },
  ja: {
    translation: translationJA
  },
  de: {
    translation: translationDE
  },
  ko: {
    translation: translationKO
  }
};

i18n
  // 检测用户语言
  .use(LanguageDetector)
  // 将i18n实例传递给react-i18next
  .use(initReactI18next)
  // 初始化i18next
  .init({
    resources,
    fallbackLng: 'en', // 默认语言设为英文
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // 不转义HTML
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });

export default i18n; 