/// <reference lib="webworker" />
/// <reference lib="es2015" />
/// <reference types="vite/client" />

declare const self: ServiceWorkerGlobalScope;
declare interface ServiceWorkerGlobalScope {
  __WB_MANIFEST: Array<{
    revision: string;
    url: string;
  }>;
  skipWaiting(): Promise<void>;
}

// 引入必要的 Workbox 模块
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

// 控制当前页面
clientsClaim();
self.skipWaiting();

// 预缓存由 Vite PWA 插件注入的资源
precacheAndRoute(self.__WB_MANIFEST);

// 单页应用的导航预缓存和路由
registerRoute(
  // 返回 true 表示是导航请求
  ({ request }) => (request as Request).mode === 'navigate',
  // 使用预缓存中的 index.html 处理导航
  createHandlerBoundToURL('index.html')
);

// 缓存图片
registerRoute(
  ({ request }) => (request as Request).destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 天
      }),
    ],
  })
);

// 缓存样式表和脚本
registerRoute(
  ({ request }) =>
    (request as Request).destination === 'style' ||
    (request as Request).destination === 'script',
  new StaleWhileRevalidate({
    cacheName: 'assets-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 天
      }),
    ],
  })
);

// API 请求缓存策略
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 1 * 24 * 60 * 60, // 1 天
      }),
    ],
  })
); 