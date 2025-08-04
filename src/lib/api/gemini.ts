export interface SwingData {
  gyroscope: {
    x: number[];
    y: number[];
    z: number[];
  };
  accelerometer: {
    x: number[];
    y: number[];
    z: number[];
  };
  timestamp: number[];
  duration: number;
}

export interface SwingAnalysis {
  swingCharacteristics: string;
  swingType: 'aggressive' | 'smooth' | 'inconsistent' | 'balanced' | 'technical';
  tempo: 'fast' | 'medium' | 'slow';
  consistency: number; // 1-10
  powerLevel: number; // 1-10
  recommendations: string[];
}

class GeminiClient {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey: string, model: string = 'gemini-2.5-flash-lite') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async analyzeSwing(swingData: SwingData): Promise<SwingAnalysis> {
    try {
      const prompt = this.createAnalysisPrompt(swingData);
      
      const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates[0].content.parts[0].text;
      
      return this.parseAnalysisResult(generatedText);
    } catch (error) {
      console.error('Gemini API error:', error);
      // フォールバック: ダミーデータを返す
      return this.getFallbackAnalysis(swingData);
    }
  }

  private createAnalysisPrompt(swingData: SwingData): string {
    const gyroSummary = this.summarizeMotionData(swingData.gyroscope);
    const accelSummary = this.summarizeMotionData(swingData.accelerometer);
    
    return `ゴルフスイングの解析を行ってください。以下のセンサーデータを基に分析してください：

ジャイロスコープデータ:
- X軸平均: ${gyroSummary.avgX.toFixed(2)}
- Y軸平均: ${gyroSummary.avgY.toFixed(2)} 
- Z軸平均: ${gyroSummary.avgZ.toFixed(2)}
- 最大値: ${gyroSummary.maxValue.toFixed(2)}

加速度センサーデータ:
- X軸平均: ${accelSummary.avgX.toFixed(2)}
- Y軸平均: ${accelSummary.avgY.toFixed(2)}
- Z軸平均: ${accelSummary.avgZ.toFixed(2)}
- 最大値: ${accelSummary.maxValue.toFixed(2)}

スイング時間: ${swingData.duration}ms

以下のJSON形式で回答してください：
{
  "swingCharacteristics": "あなたのスイングの特徴は...",
  "swingType": "smooth|aggressive|inconsistent|balanced|technical",
  "tempo": "fast|medium|slow", 
  "consistency": 1-10の数値,
  "powerLevel": 1-10の数値,
  "recommendations": ["改善点1", "改善点2", "改善点3"]
}`;
  }

  private summarizeMotionData(data: { x: number[]; y: number[]; z: number[] }) {
    const avgX = data.x.reduce((a, b) => a + b, 0) / data.x.length;
    const avgY = data.y.reduce((a, b) => a + b, 0) / data.y.length;
    const avgZ = data.z.reduce((a, b) => a + b, 0) / data.z.length;
    const maxValue = Math.max(
      Math.max(...data.x.map(Math.abs)),
      Math.max(...data.y.map(Math.abs)),
      Math.max(...data.z.map(Math.abs))
    );

    return { avgX, avgY, avgZ, maxValue };
  }

  private parseAnalysisResult(text: string): SwingAnalysis {
    try {
      // JSONの抽出を試行
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          swingCharacteristics: parsed.swingCharacteristics || "スイング解析完了",
          swingType: parsed.swingType || "balanced",
          tempo: parsed.tempo || "medium",
          consistency: parsed.consistency || 7,
          powerLevel: parsed.powerLevel || 6,
          recommendations: parsed.recommendations || ["基本的なスイング練習をお勧めします"]
        };
      }
    } catch (error) {
      console.error('JSON parsing failed:', error);
    }

    // パースに失敗した場合のフォールバック
    return this.getFallbackAnalysis();
  }

  private getFallbackAnalysis(swingData?: SwingData): SwingAnalysis {
    // データがある場合は簡単な分析を行う
    if (swingData) {
      const gyroMax = Math.max(
        Math.max(...swingData.gyroscope.x.map(Math.abs)),
        Math.max(...swingData.gyroscope.y.map(Math.abs)),
        Math.max(...swingData.gyroscope.z.map(Math.abs))
      );

      const powerLevel = Math.min(10, Math.max(1, Math.floor(gyroMax / 10)));
      const tempo = swingData.duration < 800 ? 'fast' : swingData.duration > 1500 ? 'slow' : 'medium';
      
      return {
        swingCharacteristics: `あなたのスイングは${tempo === 'fast' ? '速いテンポ' : tempo === 'slow' ? 'ゆっくりとしたテンポ' : 'バランスの良いテンポ'}で、パワーレベルは${powerLevel}/10です。`,
        swingType: powerLevel > 7 ? 'aggressive' : powerLevel < 4 ? 'smooth' : 'balanced',
        tempo,
        consistency: Math.floor(Math.random() * 3) + 6, // 6-8の範囲
        powerLevel,
        recommendations: [
          "スイングリズムの安定化",
          "フォロースルーの改善", 
          "体重移動の最適化"
        ]
      };
    }

    return {
      swingCharacteristics: "あなたのスイングはバランスが良く、安定した軌道を描いています。",
      swingType: "balanced",
      tempo: "medium",
      consistency: 7,
      powerLevel: 6,
      recommendations: [
        "スイングリズムの安定化",
        "フォロースルーの改善",
        "体重移動の最適化"
      ]
    };
  }
}

// 環境変数からAPIキーを取得する関数
export function createGeminiClient(): GeminiClient | null {
  if (typeof window === 'undefined') {
    // サーバーサイドでは環境変数から取得
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash-lite';
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return null;
    }
    
    return new GeminiClient(apiKey, model);
  } else {
    // クライアントサイドでは公開されている設定のみ使用
    // 実際のプロダクションではAPI Routeを経由すべき
    console.warn('Gemini client should be used server-side only');
    return null;
  }
}

export { GeminiClient };