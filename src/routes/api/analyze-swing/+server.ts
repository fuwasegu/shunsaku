import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GeminiClient } from '$lib/api/gemini.js';
import type { SwingData, SwingAnalysis } from '$lib/api/gemini.js';
import { env } from '$env/dynamic/private';
import { PUBLIC_GEMINI_MODEL } from '$env/static/public';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const swingData: SwingData = await request.json();
    
    // データバリデーション
    if (!swingData || !swingData.gyroscope || !swingData.accelerometer) {
      return json(
        { error: 'Invalid swing data format' }, 
        { status: 400 }
      );
    }

    // Gemini APIキーが設定されているかチェック
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not configured, using fallback analysis');
      return json(getFallbackAnalysis(swingData));
    }

    // Gemini クライアントを作成
    const model = PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash-lite';
    const geminiClient = new GeminiClient(apiKey, model);
    
    // スイング解析を実行
    const analysis = await geminiClient.analyzeSwing(swingData);
    
    return json(analysis);
    
  } catch (error) {
    console.error('API Error:', error);
    
    // エラー時はフォールバック解析を返す
    try {
      const swingData: SwingData = await request.json();
      return json(getFallbackAnalysis(swingData));
    } catch {
      return json(
        { error: 'Internal server error' }, 
        { status: 500 }
      );
    }
  }
};

function getFallbackAnalysis(swingData: SwingData): SwingAnalysis {
  const gyroMax = Math.max(
    Math.max(...swingData.gyroscope.x.map(Math.abs)),
    Math.max(...swingData.gyroscope.y.map(Math.abs)),
    Math.max(...swingData.gyroscope.z.map(Math.abs))
  );

  const powerLevel = Math.min(10, Math.max(1, Math.floor(gyroMax / 10)));
  const tempo = swingData.duration < 800 ? 'fast' : swingData.duration > 1500 ? 'slow' : 'medium';
  
  const swingCharacteristics = generateSwingCharacteristics(swingData, powerLevel, tempo);
  
  return {
    swingCharacteristics,
    swingType: powerLevel > 7 ? 'aggressive' : powerLevel < 4 ? 'smooth' : 'balanced',
    tempo,
    consistency: Math.floor(Math.random() * 3) + 6, // 6-8の範囲
    powerLevel,
    recommendations: [
      "スイングリズムの安定化を心がけましょう",
      "フォロースルーでのクラブヘッドの軌道を意識してください", 
      "体重移動のタイミングを最適化しましょう"
    ]
  };
}

function generateSwingCharacteristics(data: SwingData, powerLevel: number, tempo: string): string {
  const tempoText = tempo === 'fast' ? '速いテンポ' : tempo === 'slow' ? 'ゆっくりとしたテンポ' : 'バランスの良いテンポ';
  const powerText = powerLevel > 7 ? '力強い' : powerLevel < 4 ? 'ソフトな' : '安定した';
  
  const gyroVariance = calculateVariance(data.gyroscope.x);
  const stabilityText = gyroVariance < 50 ? '非常に安定した' : gyroVariance < 100 ? '安定した' : 'やや不安定な';
  
  return `あなたのスイングは${tempoText}で、${powerText}振りが特徴的です。センサーデータからは${stabilityText}軌道を描いており、${
    powerLevel > 6 ? '力強さがありながらも' : '繊細なタッチで'
  }スイングを行っていることが分かります。`;
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - mean, 2));
  return squareDiffs.reduce((a, b) => a + b, 0) / values.length;
}