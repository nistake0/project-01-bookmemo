import React, { useState, useEffect, useCallback } from 'react';
import { PATHS } from '../config/paths';

/**
 * PWA機能を管理するカスタムフック
 * 
 * 機能:
 * - Service Workerの登録・更新
 * - インストールプロンプトの管理
 * - オフライン状態の監視
 * - プッシュ通知の管理
 * - インストール促進機能
 * 
 * @returns {object} PWA関連の状態と関数
 */
export const usePWA = () => {
  // Reactコンテキストの安全性チェック
  try {
    if (typeof React === 'undefined' || !React.useState) {
      return {
        isOnline: true,
        isInstallable: false,
        isInstalled: false,
        swRegistration: null,
        userEngagement: 0,
        lastVisitTime: null,
        shouldShowInstallPrompt: false,
        shouldShowManualInstallGuide: false,
        registerServiceWorker: async () => null,
        installApp: async () => {},
        requestNotificationPermission: async () => 'denied',
        sendNotification: () => null,
        checkForUpdates: async () => {},
        clearCache: async () => {},
        reloadApp: () => {},
        recordInstallPromptDismiss: () => {}
      };
    }
  } catch (error) {
    console.warn('React context not available in usePWA:', error);
    return {
      isOnline: true,
      isInstallable: false,
      isInstalled: false,
      swRegistration: null,
      userEngagement: 0,
      lastVisitTime: null,
      shouldShowInstallPrompt: false,
      shouldShowManualInstallGuide: false,
      registerServiceWorker: async () => null,
      installApp: async () => {},
      requestNotificationPermission: async () => 'denied',
      sendNotification: () => null,
      checkForUpdates: async () => {},
      clearCache: async () => {},
      reloadApp: () => {},
      recordInstallPromptDismiss: () => {}
    };
  }

  // 開発環境ではPWA機能を無効化
  const isPWASupported = typeof window !== 'undefined' && 
    typeof navigator !== 'undefined' && 
    'serviceWorker' in navigator && 
    'PushManager' in window &&
    !PATHS.IS_DEVELOPMENT();
  
  // PWAがサポートされていない場合は最小限の状態を返す
  if (!isPWASupported) {
    return {
      isOnline: true,
      isInstallable: false,
      isInstalled: false,
      swRegistration: null,
      userEngagement: 0,
      lastVisitTime: null,
      shouldShowInstallPrompt: false,
      shouldShowManualInstallGuide: false,
      registerServiceWorker: async () => null,
      installApp: async () => {},
      requestNotificationPermission: async () => 'denied',
      sendNotification: () => null,
      checkForUpdates: async () => {},
      clearCache: async () => {},
      reloadApp: () => {},
      recordInstallPromptDismiss: () => {}
    };
  }
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swRegistration, setSwRegistration] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [userEngagement, setUserEngagement] = useState(0);
  const [lastVisitTime, setLastVisitTime] = useState(null);

  // オンライン状態の監視
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ユーザーエンゲージメントの追跡
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUserActivity = () => {
      setUserEngagement(prev => prev + 1);
    };

    const events = ['click', 'scroll', 'keydown', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, []);

  // 訪問回数の追跡
  useEffect(() => {
    if (typeof localStorage === 'undefined') return;

    const now = Date.now();
    const lastVisit = localStorage.getItem('bookmemo_last_visit');
    
    if (lastVisit) {
      const timeDiff = now - parseInt(lastVisit);
      // 24時間以上経過している場合は新しい訪問としてカウント
      if (timeDiff > 24 * 60 * 60 * 1000) {
        const visitCount = parseInt(localStorage.getItem('bookmemo_visit_count') || '0') + 1;
        localStorage.setItem('bookmemo_visit_count', visitCount.toString());
      }
    } else {
      localStorage.setItem('bookmemo_visit_count', '1');
    }
    
    localStorage.setItem('bookmemo_last_visit', now.toString());
    setLastVisitTime(now);
  }, []);

  // Service Workerの登録
  const registerServiceWorker = useCallback(async () => {
    // 開発環境でのHTTPSエラーを防ぐため、開発環境ではService Workerを登録しない
    if (PATHS.IS_DEVELOPMENT()) {
      console.log('Service Worker registration skipped in development environment');
      return null;
    }

    try {
      const swPath = PATHS.SW_JS();
      const registration = await navigator.serviceWorker.register(swPath);
      setSwRegistration(registration);
      console.log('Service Worker registered:', registration);

      // 更新の確認
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 新しいService Workerが利用可能
              console.log('New Service Worker available');
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      // エラーはログに記録するが、アプリの動作は継続
      console.warn('Service Worker registration failed, but app will continue without PWA features');
      return null;
    }
  }, []);

  // インストールプロンプトの管理
  useEffect(() => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
      
      // インストール完了を記録
      localStorage.setItem('bookmemo_installed', 'true');
      localStorage.setItem('bookmemo_install_date', Date.now().toString());
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 既にインストールされているかチェック
    const isAlreadyInstalled = localStorage.getItem('bookmemo_installed') === 'true';
    if (isAlreadyInstalled) {
      setIsInstalled(true);
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // アプリのインストール
  const installApp = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  }, [deferredPrompt]);

  // インストール促進のタイミング判定
  const shouldShowInstallPrompt = useCallback(() => {
    if (isInstalled || !isInstallable) return false;
    
    const visitCount = parseInt(localStorage.getItem('bookmemo_visit_count') || '0');
    const dismissCount = parseInt(localStorage.getItem('bookmemo_dismiss_count') || '0');
    
    // 条件を緩和：訪問回数1回以上、エンゲージメント5以上、拒否回数3回未満
    return visitCount >= 1 && userEngagement >= 5 && dismissCount < 3;
  }, [isInstalled, isInstallable, userEngagement]);

  // 手動インストールガイドの表示判定（iPhone用）
  const shouldShowManualInstallGuide = useCallback(() => {
    if (isInstalled) return false;
    
    // iPhone Safariの場合は手動インストールガイドを表示
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    return isIOS && isSafari;
  }, [isInstalled]);

  // インストール促進の記録
  const recordInstallPromptDismiss = useCallback(() => {
    if (typeof localStorage === 'undefined') return;
    
    const dismissCount = parseInt(localStorage.getItem('bookmemo_dismiss_count') || '0') + 1;
    localStorage.setItem('bookmemo_dismiss_count', dismissCount.toString());
  }, []);

  // プッシュ通知の許可要求
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.warn('Notification permission request failed:', error);
      return 'denied';
    }
  }, []);

  // プッシュ通知の送信
  const sendNotification = useCallback((title, options = {}) => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return null;
    }
    
    try {
      const iconPath = PATHS.ICON_192();
      return new Notification(title, {
        icon: iconPath,
        badge: iconPath,
        ...options
      });
    } catch (error) {
      console.warn('Notification send failed:', error);
      return null;
    }
  }, []);

  // 更新の確認
  const checkForUpdates = useCallback(async () => {
    if (swRegistration) {
      await swRegistration.update();
    }
  }, [swRegistration]);

  // キャッシュのクリア
  const clearCache = useCallback(async () => {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return;
    }
    
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    } catch (error) {
      console.warn('Cache clear failed:', error);
    }
  }, []);

  // アプリの再読み込み
  const reloadApp = useCallback(() => {
    window.location.reload();
  }, []);

  return {
    isOnline,
    isInstallable,
    isInstalled,
    swRegistration,
    userEngagement,
    lastVisitTime,
    shouldShowInstallPrompt: shouldShowInstallPrompt(),
    shouldShowManualInstallGuide: shouldShowManualInstallGuide(),
    registerServiceWorker,
    installApp,
    requestNotificationPermission,
    sendNotification,
    checkForUpdates,
    clearCache,
    reloadApp,
    recordInstallPromptDismiss
  };
};
