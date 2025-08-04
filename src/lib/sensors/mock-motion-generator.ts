import type { MotionReading } from './motion-detector.js';
import { addDebugLog } from '$lib/stores/debug.js';

export interface MockSwingConfig {
  duration: number; // スイング時間（ms）
  maxRotation: number; // 最大回転速度 (rad/s)
  maxAcceleration: number; // 最大加速度 (m/s²)
  swingPattern: 'slow' | 'normal' | 'fast' | 'aggressive';
}

export class MockMotionGenerator {
  private config: MockSwingConfig;
  private startTime = 0;
  private isGenerating = false;
  private interval?: NodeJS.Timeout;
  private onDataCallback?: (reading: MotionReading) => void;
  private samplingRate = 50; // 50ms間隔

  constructor(config: Partial<MockSwingConfig> = {}) {
    this.config = {
      duration: 2000, // 2秒のスイング
      maxRotation: 15,
      maxAcceleration: 10,
      swingPattern: 'normal',
      ...config
    };
  }

  // スイングパターンを生成
  generateSwingData(): MotionReading[] {
    const readings: MotionReading[] = [];
    const totalSamples = Math.floor(this.config.duration / this.samplingRate);
    
    addDebugLog('info', 'モックスイングデータ生成開始', {
      duration: this.config.duration,
      pattern: this.config.swingPattern,
      samples: totalSamples
    });

    for (let i = 0; i < totalSamples; i++) {
      const progress = i / totalSamples;
      const timestamp = i * this.samplingRate;
      
      // スイングの各フェーズ（テイクバック、ダウンスイング、インパクト、フォロー）
      const phase = this.getSwingPhase(progress);
      const intensity = this.getIntensityForPhase(phase, progress);
      
      const reading: MotionReading = {
        gyroscope: this.generateGyroscopeData(progress, intensity),
        accelerometer: this.generateAccelerometerData(progress, intensity),
        timestamp
      };
      
      readings.push(reading);
    }

    addDebugLog('info', `モックデータ生成完了: ${readings.length}件のサンプル`);
    return readings;
  }

  // リアルタイムでのモックデータ生成を開始
  startRealTimeGeneration(onData: (reading: MotionReading) => void) {
    if (this.isGenerating) {
      addDebugLog('warn', 'モック生成は既に開始されています');
      return false;
    }

    this.onDataCallback = onData;
    this.isGenerating = true;
    this.startTime = Date.now();
    
    addDebugLog('info', 'リアルタイムモック生成開始', { pattern: this.config.swingPattern });

    this.interval = setInterval(() => {
      if (!this.isGenerating) return;

      const elapsed = Date.now() - this.startTime;
      const progress = elapsed / this.config.duration;

      if (progress >= 1.0) {
        this.stopRealTimeGeneration();
        return;
      }

      const phase = this.getSwingPhase(progress);
      const intensity = this.getIntensityForPhase(phase, progress);
      
      const reading: MotionReading = {
        gyroscope: this.generateGyroscopeData(progress, intensity),
        accelerometer: this.generateAccelerometerData(progress, intensity),
        timestamp: elapsed
      };

      this.onDataCallback?.(reading);
    }, this.samplingRate);

    return true;
  }

  stopRealTimeGeneration() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    this.isGenerating = false;
    addDebugLog('info', 'リアルタイムモック生成停止');
  }

  private getSwingPhase(progress: number): 'takeaway' | 'backswing' | 'downswing' | 'impact' | 'follow' {
    if (progress < 0.3) return 'takeaway';
    if (progress < 0.5) return 'backswing';
    if (progress < 0.65) return 'downswing';
    if (progress < 0.75) return 'impact';
    return 'follow';
  }

  private getIntensityForPhase(phase: string, progress: number): number {
    const baseIntensity = this.getBaseIntensityForPattern();
    
    switch (phase) {
      case 'takeaway': return baseIntensity * 0.2;
      case 'backswing': return baseIntensity * 0.4;
      case 'downswing': return baseIntensity * 0.8;
      case 'impact': return baseIntensity * 1.0;
      case 'follow': return baseIntensity * 0.6 * (1 - (progress - 0.75) / 0.25);
      default: return baseIntensity * 0.1;
    }
  }

  private getBaseIntensityForPattern(): number {
    switch (this.config.swingPattern) {
      case 'slow': return 0.6;
      case 'normal': return 1.0;
      case 'fast': return 1.4;
      case 'aggressive': return 1.8;
      default: return 1.0;
    }
  }

  private generateGyroscopeData(progress: number, intensity: number) {
    // スイング軌道をシミュレート
    const swing_angle = progress * Math.PI * 2; // 0から2πまで
    const noise = () => (Math.random() - 0.5) * 0.5; // ノイズ
    
    return {
      x: this.config.maxRotation * intensity * Math.sin(swing_angle * 2) + noise(),
      y: this.config.maxRotation * intensity * Math.cos(swing_angle) + noise(),
      z: this.config.maxRotation * intensity * 0.3 * Math.sin(swing_angle * 3) + noise()
    };
  }

  private generateAccelerometerData(progress: number, intensity: number) {
    // 加速度パターンをシミュレート
    const accel_pattern = Math.sin(progress * Math.PI * 1.5);
    const noise = () => (Math.random() - 0.5) * 0.3;
    
    return {
      x: this.config.maxAcceleration * intensity * accel_pattern * 0.8 + noise(),
      y: this.config.maxAcceleration * intensity * accel_pattern + noise(),
      z: this.config.maxAcceleration * intensity * accel_pattern * 0.5 + noise()
    };
  }

  // 設定の更新
  updateConfig(newConfig: Partial<MockSwingConfig>) {
    this.config = { ...this.config, ...newConfig };
    addDebugLog('info', 'モック設定更新', this.config);
  }

  getIsGenerating(): boolean {
    return this.isGenerating;
  }
}

// プリセットパターン
export const mockSwingPresets = {
  beginner: {
    duration: 2500,
    maxRotation: 8,
    maxAcceleration: 6,
    swingPattern: 'slow' as const
  },
  intermediate: {
    duration: 2000,
    maxRotation: 15,
    maxAcceleration: 10,
    swingPattern: 'normal' as const
  },
  advanced: {
    duration: 1800,
    maxRotation: 22,
    maxAcceleration: 15,
    swingPattern: 'fast' as const
  },
  pro: {
    duration: 1500,
    maxRotation: 30,
    maxAcceleration: 20,
    swingPattern: 'aggressive' as const
  }
};