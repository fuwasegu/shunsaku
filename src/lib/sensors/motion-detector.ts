import type { SwingData } from '$lib/api/gemini.js';
import { MockMotionGenerator, mockSwingPresets } from './mock-motion-generator.js';
import { addDebugLog, isPCEnvironment } from '$lib/stores/debug.js';

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
  
  // デバッグモード関連
  private debugMode = false;
  private mockGenerator?: MockMotionGenerator;

  constructor(config: Partial<SwingDetectionConfig> = {}) {
    this.config = {
      threshold: 8.0, // rad/s for gyroscope (より高い閾値でスイング検出)
      minDuration: 800, // 0.8 seconds (最小スイング時間)
      maxDuration: 10000, // 10 seconds (最大待機時間)
      samplingRate: 50, // 50ms (より高頻度でサンプリング)
      ...config
    };
    
    // PC環境の場合、自動的にデバッグモードを有効にする
    if (isPCEnvironment()) {
      this.debugMode = true;
      addDebugLog('info', 'PC環境を検出、デバッグモードを有効化');
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      addDebugLog('info', 'センサー権限の確認を開始');
      
      // デバッグモードの場合は常に許可
      if (this.debugMode) {
        addDebugLog('info', 'デバッグモード: 権限要求をスキップ');
        return true;
      }
      
      // 基本的なサポート確認
      if (typeof DeviceMotionEvent === 'undefined') {
        addDebugLog('warn', 'DeviceMotionEventがサポートされていません');
        return false;
      }

      // iOS 13+ では明示的な権限要求が必要
      if ('requestPermission' in DeviceMotionEvent && 
          typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        addDebugLog('info', 'iOS権限要求を実行中...');
        const permission = await (DeviceMotionEvent as any).requestPermission();
        addDebugLog('info', `権限要求結果: ${permission}`);
        return permission === 'granted';
      }
      
      // Android や古いiOSでは自動的に利用可能
      addDebugLog('info', 'このデバイスでは権限要求は不要');
      return true;
    } catch (error) {
      addDebugLog('error', '権限要求エラー', error);
      this.onErrorCallback?.(`権限要求エラー: ${error}`);
      return false;
    }
  }

  isSupported(): boolean {
    // デバッグモードの場合は常にサポート
    if (this.debugMode) {
      return true;
    }
    
    return typeof DeviceMotionEvent !== 'undefined' && 
           typeof DeviceOrientationEvent !== 'undefined';
  }

  startRecording(): boolean {
    if (!this.isSupported()) {
      const error = 'デバイスがセンサーに対応していません';
      addDebugLog('error', error);
      this.onErrorCallback?.(error);
      return false;
    }

    if (this.isRecording) {
      addDebugLog('warn', '既に記録中です');
      return false;
    }

    this.isRecording = true;
    this.readings = [];
    this.startTime = Date.now();
    this.lastMotionTime = 0;

    addDebugLog('info', 'センサー記録開始', { 
      debugMode: this.debugMode,
      config: this.config 
    });

    // デバッグモードの場合はモックデータを使用
    if (this.debugMode) {
      this.startMockRecording();
    } else {
      this.startRealRecording();
    }

    // 最大記録時間でタイムアウト
    this.swingDetectionTimer = setTimeout(() => {
      if (this.isRecording) {
        addDebugLog('warn', '最大記録時間に達したため記録を停止');
        this.stopRecording();
      }
    }, this.config.maxDuration);

    return true;
  }
  
  private startMockRecording() {
    addDebugLog('info', 'モック記録を開始');
    
    // ランダムなプリセットを選択
    const presetNames = Object.keys(mockSwingPresets) as Array<keyof typeof mockSwingPresets>;
    const randomPreset = presetNames[Math.floor(Math.random() * presetNames.length)];
    const preset = mockSwingPresets[randomPreset];
    
    addDebugLog('info', `使用するプリセット: ${randomPreset}`, preset);
    
    this.mockGenerator = new MockMotionGenerator(preset);
    
    this.mockGenerator.startRealTimeGeneration((reading) => {
      if (!this.isRecording) return;
      
      this.readings.push(reading);
      this.onDataCallback?.(reading);
      
      // スイング検出ロジック
      this.detectSwingMotion(reading);
    });
  }
  
  private startRealRecording() {
    addDebugLog('info', 'リアルセンサー記録を開始');
    
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
  }

  stopRecording(): SwingData | null {
    if (!this.isRecording) {
      addDebugLog('warn', '記録が開始されていません');
      return null;
    }

    this.isRecording = false;
    addDebugLog('info', `記録停止 - ${this.readings.length}件のデータを取得`);

    // モック生成器の停止
    if (this.mockGenerator) {
      this.mockGenerator.stopRealTimeGeneration();
      this.mockGenerator = undefined;
    }

    // リアルセンサーのクリーンアップ
    if (this.motionHandler) {
      window.removeEventListener('devicemotion', this.motionHandler);
    }

    if (this.swingDetectionTimer) {
      clearTimeout(this.swingDetectionTimer);
    }

    if (this.readings.length === 0) {
      addDebugLog('warn', 'データが取得されませんでした');
      return null;
    }

    const swingData = this.processReadings();
    addDebugLog('info', 'スイングデータ処理完了', {
      duration: swingData.duration,
      samples: swingData.gyroscope.x.length
    });
    
    return swingData;
  }

  private detectSwingMotion(reading: MotionReading) {
    // ジャイロセンサーの合成値を計算
    const gyroMagnitude = Math.sqrt(
      reading.gyroscope.x ** 2 + 
      reading.gyroscope.y ** 2 + 
      reading.gyroscope.z ** 2
    );

    // 加速度の合成値も計算（よりよいスイング検出のため）
    const accelMagnitude = Math.sqrt(
      reading.accelerometer.x ** 2 + 
      reading.accelerometer.y ** 2 + 
      reading.accelerometer.z ** 2
    );

    // スイングらしい動作を検出（ジャイロ + 加速度の組み合わせ）
    if (gyroMagnitude > this.config.threshold && accelMagnitude > 2.0) {
      addDebugLog('info', `スイング動作検出`, {
        gyro: gyroMagnitude.toFixed(2),
        accel: accelMagnitude.toFixed(2),
        timestamp: reading.timestamp
      });
      
      // 一定時間後に自動停止するタイマーをリセット
      if (this.swingDetectionTimer) {
        clearTimeout(this.swingDetectionTimer);
      }

      this.swingDetectionTimer = setTimeout(() => {
        if (this.isRecording && reading.timestamp > this.config.minDuration) {
          addDebugLog('info', 'スイング完了を検出、解析を開始');
          const swingData = this.stopRecording();
          if (swingData) {
            this.onSwingDetectedCallback?.(swingData);
          }
        }
      }, 1500); // 1.5秒間動作が収まったら終了
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
    addDebugLog('info', '設定更新', this.config);
  }
  
  // デバッグモードの制御
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
    addDebugLog('info', `デバッグモード: ${enabled ? '有効' : '無効'}`);
  }
  
  getDebugMode(): boolean {
    return this.debugMode;
  }
  
  // 手動でモックスイングを生成
  generateMockSwing(preset?: keyof typeof mockSwingPresets): SwingData {
    const presetName = preset || 'intermediate';
    const presetConfig = mockSwingPresets[presetName];
    
    addDebugLog('info', `手動モックスイング生成: ${presetName}`);
    
    const generator = new MockMotionGenerator(presetConfig);
    const readings = generator.generateSwingData();
    
    // 一時的にreadingsを設定してprocessReadingsを呼び出し
    const originalReadings = this.readings;
    this.readings = readings;
    const swingData = this.processReadings();
    this.readings = originalReadings;
    
    addDebugLog('info', 'モックスイング生成完了', {
      duration: swingData.duration,
      samples: swingData.gyroscope.x.length
    });
    
    return swingData;
  }
}

export default MotionDetector;
export type { MotionReading, SwingDetectionConfig };