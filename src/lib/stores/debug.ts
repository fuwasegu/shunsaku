import { writable } from 'svelte/store';

// デバッグモードの状態管理
export const debugMode = writable(false);

// デバッグログの型定義
export interface DebugLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

// デバッグログストア
export const debugLogs = writable<DebugLog[]>([]);

// ログ追加関数
export function addDebugLog(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const log: DebugLog = {
    timestamp: new Date(),
    level,
    message,
    data
  };
  
  debugLogs.update(logs => {
    const newLogs = [log, ...logs];
    // 最新50件のみ保持
    return newLogs.slice(0, 50);
  });
  
  // コンソールにも出力
  const timestamp = log.timestamp.toLocaleTimeString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  switch (level) {
    case 'error':
      console.error(prefix, message, data || '');
      break;
    case 'warn':
      console.warn(prefix, message, data || '');
      break;
    default:
      console.log(prefix, message, data || '');
  }
}

// PC環境判定関数
export function isPCEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const screenWidth = window.screen.width;
  
  // PC判定ロジック：
  // 1. モバイルUAでない
  // 2. かつ (タッチ非対応 または 画面幅が1024px以上)
  return !isMobile && (!hasTouch || screenWidth >= 1024);
}

// デバッグ情報取得
export function getDebugInfo() {
  const userAgent = navigator.userAgent;
  const screenInfo = {
    width: window.screen.width,
    height: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight,
    devicePixelRatio: window.devicePixelRatio
  };
  
  const supportInfo = {
    deviceMotion: typeof DeviceMotionEvent !== 'undefined',
    deviceOrientation: typeof DeviceOrientationEvent !== 'undefined',
    requestPermission: typeof DeviceMotionEvent !== 'undefined' && 
                      'requestPermission' in DeviceMotionEvent,
    touchEvents: 'ontouchstart' in window,
    maxTouchPoints: navigator.maxTouchPoints
  };
  
  return {
    userAgent,
    screenInfo,
    supportInfo,
    isPCEnvironment: isPCEnvironment(),
    timestamp: new Date().toISOString()
  };
}