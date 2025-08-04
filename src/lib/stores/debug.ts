import { writable } from 'svelte/store';

// デバッグモードの状態管理
export const debugMode = writable(false);
export const debugLogs = writable<Array<{
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}>>([]);

// デバッグログを追加する関数
export function addDebugLog(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  debugLogs.update(logs => [
    ...logs,
    {
      timestamp: Date.now(),
      level,
      message,
      data
    }
  ].slice(-100)); // 最新100件を保持
}

// ログをクリアする関数
export function clearDebugLogs() {
  debugLogs.set([]);
}

// PC環境かどうかを判定
export function isPCEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  
  // UserAgentでモバイルかどうかを判定
  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  console.log('PC環境判定:', {
    userAgent: userAgent.substring(0, 50),
    isMobile,
    hasDeviceMotionEvent: typeof DeviceMotionEvent !== 'undefined',
    isPCEnvironment: typeof DeviceMotionEvent === 'undefined' || !isMobile
  });
  
  // DeviceMotionEventが存在しないか、またはモバイルでない場合はPC環境と判定
  return typeof DeviceMotionEvent === 'undefined' || !isMobile;
}