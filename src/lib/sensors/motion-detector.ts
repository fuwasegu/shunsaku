import type { SwingData } from '$lib/api/gemini.js';

export interface MotionReading {
  gyroscope: {
    x: number;
    y: number;
    z: number;
  };
  accelerometer: {
    x: number;
    y: number;
    z: number;
  };
  timestamp: number;
}

export interface SwingDetectionConfig {
  threshold: number; // 動作検出の閾値
  minDuration: number; // 最小スイング時間（ms）
  maxDuration: number; // 最大スイング時間（ms）
  samplingRate: number; // データ取得間隔（ms）
}

export class MotionDetector {
  private isRecording = false;
  private readings: MotionReading[] = [];
  private startTime = 0;
  private config: SwingDetectionConfig;
  private onDataCallback?: (reading: MotionReading) => void;
  private onSwingDetectedCallback?: (data: SwingData) => void;
  private onErrorCallback?: (error: string) => void;
  
  private motionHandler?: (event: DeviceMotionEvent) => void;
  private swingDetectionTimer?: NodeJS.Timeout;
  private lastMotionTime = 0;

  constructor(config: Partial<SwingDetectionConfig> = {}) {
    this.config = {
      threshold: 5.0, // rad/s for gyroscope
      minDuration: 500, // 0.5 seconds
      maxDuration: 3000, // 3 seconds
      samplingRate: 100, // 100ms
      ...config
    };
  }

  async requestPermission(): Promise<boolean> {
    try {
      // iOS 13+ では明示的な権限要求が必要
      if (typeof DeviceMotionEvent !== 'undefined' && 
          'requestPermission' in DeviceMotionEvent) {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        return permission === 'granted';
      }
      
      // Android では自動的に利用可能
      return typeof DeviceMotionEvent !== 'undefined';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  isSupported(): boolean {
    return typeof DeviceMotionEvent !== 'undefined' && 
           typeof DeviceOrientationEvent !== 'undefined';
  }

  startRecording(): boolean {
    if (!this.isSupported()) {
      this.onErrorCallback?.('デバイスがセンサーに対応していません');
      return false;
    }

    if (this.isRecording) {
      return false;
    }

    this.isRecording = true;
    this.readings = [];
    this.startTime = Date.now();
    this.lastMotionTime = 0;

    this.motionHandler = (event: DeviceMotionEvent) => {
      if (!this.isRecording) return;

      const now = Date.now();
      
      // サンプリングレート制御
      if (now - this.lastMotionTime < this.config.samplingRate) {
        return;
      }
      this.lastMotionTime = now;

      if (event.rotationRate && event.acceleration) {
        const reading: MotionReading = {
          gyroscope: {
            x: event.rotationRate.alpha || 0,
            y: event.rotationRate.beta || 0,
            z: event.rotationRate.gamma || 0
          },
          accelerometer: {
            x: event.acceleration.x || 0,
            y: event.acceleration.y || 0,
            z: event.acceleration.z || 0
          },
          timestamp: now - this.startTime
        };

        this.readings.push(reading);
        this.onDataCallback?.(reading);

        // スイング検出ロジック
        this.detectSwingMotion(reading);
      }
    };

    window.addEventListener('devicemotion', this.motionHandler);

    // 最大記録時間でタイムアウト
    this.swingDetectionTimer = setTimeout(() => {
      if (this.isRecording) {
        this.stopRecording();
      }
    }, this.config.maxDuration);

    return true;
  }

  stopRecording(): SwingData | null {
    if (!this.isRecording) {
      return null;
    }

    this.isRecording = false;

    if (this.motionHandler) {
      window.removeEventListener('devicemotion', this.motionHandler);
    }

    if (this.swingDetectionTimer) {
      clearTimeout(this.swingDetectionTimer);
    }

    if (this.readings.length === 0) {
      return null;
    }

    const swingData = this.processReadings();
    return swingData;
  }

  private detectSwingMotion(reading: MotionReading) {
    // ジャイロセンサーの合成値を計算
    const gyroMagnitude = Math.sqrt(
      reading.gyroscope.x ** 2 + 
      reading.gyroscope.y ** 2 + 
      reading.gyroscope.z ** 2
    );

    // 閾値を超えた動作を検出
    if (gyroMagnitude > this.config.threshold) {
      // 一定時間後に自動停止するタイマーをリセット
      if (this.swingDetectionTimer) {
        clearTimeout(this.swingDetectionTimer);
      }

      this.swingDetectionTimer = setTimeout(() => {
        if (this.isRecording && reading.timestamp > this.config.minDuration) {
          const swingData = this.stopRecording();
          if (swingData) {
            this.onSwingDetectedCallback?.(swingData);
          }
        }
      }, 1000); // 1秒間動作が収まったら終了
    }
  }

  private processReadings(): SwingData {
    const gyroscope = {
      x: this.readings.map(r => r.gyroscope.x),
      y: this.readings.map(r => r.gyroscope.y),
      z: this.readings.map(r => r.gyroscope.z)
    };

    const accelerometer = {
      x: this.readings.map(r => r.accelerometer.x),
      y: this.readings.map(r => r.accelerometer.y),
      z: this.readings.map(r => r.accelerometer.z)
    };

    const timestamp = this.readings.map(r => r.timestamp);
    const duration = this.readings.length > 0 ? 
      this.readings[this.readings.length - 1].timestamp : 0;

    return {
      gyroscope,
      accelerometer,
      timestamp,
      duration
    };
  }

  // イベントハンドラーの設定
  onData(callback: (reading: MotionReading) => void) {
    this.onDataCallback = callback;
  }

  onSwingDetected(callback: (data: SwingData) => void) {
    this.onSwingDetectedCallback = callback;
  }

  onError(callback: (error: string) => void) {
    this.onErrorCallback = callback;
  }

  // 記録状態の確認
  getIsRecording(): boolean {
    return this.isRecording;
  }

  getReadingsCount(): number {
    return this.readings.length;
  }

  // 設定の更新
  updateConfig(newConfig: Partial<SwingDetectionConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

export default MotionDetector;