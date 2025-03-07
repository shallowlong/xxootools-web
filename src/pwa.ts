/**
 * 注册并管理 PWA 的 Service Worker
 */

import { registerSW } from 'virtual:pwa-register';

// 检测更新间隔（单位：小时）
const updateCheckInterval = 24;

export function registerServiceWorker() {
  // 在生产环境和开发环境中都启用 PWA
  const updateSW = registerSW({
    onNeedRefresh() {
      // 当有新版本可用时
      console.log('🔄 新版本可用，正在刷新...');
      updateSW(true);
    },
    onOfflineReady() {
      // 当 Service Worker 准备好离线使用时
      console.log('✅ 应用已准备好离线使用');
    }
  });

  // 定期检查更新
  setInterval(() => {
    updateSW();
  }, 1000 * 60 * 60 * updateCheckInterval);

  console.log('🚀 PWA 服务已初始化');
}