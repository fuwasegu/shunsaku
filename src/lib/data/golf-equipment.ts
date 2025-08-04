export interface ClubHead {
  id: string;
  name: string;
  brand: string;
  type: 'driver' | 'fairway' | 'iron' | 'wedge' | 'putter';
  loft: number;
  characteristics: string[];
  price: number;
  amazonUrl: string;
  image?: string;
}

export interface Shaft {
  id: string;
  name: string;
  brand: string;
  flex: 'L' | 'A' | 'R' | 'S' | 'X';
  weight: number;
  torque: number;
  kickPoint: 'low' | 'mid' | 'high';
  characteristics: string[];
  price: number;
  amazonUrl: string;
}

export interface Combination {
  id: string;
  head: ClubHead;
  shaft: Shaft;
  reason: string;
  expectedEffect: string;
  compatibility: number; // 1-10のスコア
}

// ダミーのクラブヘッドデータ（10種類）
export const clubHeads: ClubHead[] = [
  {
    id: 'head-001',
    name: 'TaylorMade SIM2 Driver',
    brand: 'TaylorMade',
    type: 'driver',
    loft: 10.5,
    characteristics: ['高弾道', '寛容性', '飛距離重視'],
    price: 58000,
    amazonUrl: 'https://amazon.co.jp/dp/B08DUMMY001'
  },
  {
    id: 'head-002',
    name: 'Callaway EPIC MAX Driver',
    brand: 'Callaway',
    type: 'driver',
    loft: 9.0,
    characteristics: ['低スピン', 'パワーヒッター向け', '高初速'],
    price: 62000,
    amazonUrl: 'https://amazon.co.jp/dp/B08DUMMY002'
  },
  {
    id: 'head-003',
    name: 'PING G425 MAX Driver',
    brand: 'PING',
    type: 'driver',
    loft: 10.5,
    characteristics: ['安定性', '直進性', '初心者向け'],
    price: 55000,
    amazonUrl: 'https://amazon.co.jp/dp/B08DUMMY003'
  },
  {
    id: 'head-004',
    name: 'Titleist TSi3 Driver',
    brand: 'Titleist',
    type: 'driver',
    loft: 8.5,
    characteristics: ['低弾道', '操作性', '上級者向け'],
    price: 68000,
    amazonUrl: 'https://amazon.co.jp/dp/B08DUMMY004'
  },
  {
    id: 'head-005',
    name: 'Mizuno ST-Z Driver',
    brand: 'Mizuno',
    type: 'driver',
    loft: 9.5,
    characteristics: ['中弾道', 'バランス重視', '打感'],
    price: 52000,
    amazonUrl: 'https://amazon.co.jp/dp/B08DUMMY005'
  },
  {
    id: 'head-006',
    name: 'XXIO 12 Driver',
    brand: 'XXIO',
    type: 'driver',
    loft: 11.5,
    characteristics: ['軽量', 'シニア向け', '飛距離アップ'],
    price: 48000,
    amazonUrl: 'https://amazon.co.jp/dp/B08DUMMY006'
  },
  {
    id: 'head-007',
    name: 'Cobra RAD Speed Driver',
    brand: 'Cobra',
    type: 'driver',
    loft: 10.0,
    characteristics: ['スピード重視', '革新技術', 'アスリート向け'],
    price: 45000,
    amazonUrl: 'https://amazon.co.jp/dp/B08DUMMY007'
  },
  {
    id: 'head-008',
    name: 'Wilson Staff Model Driver',
    brand: 'Wilson',
    type: 'driver',
    loft: 9.0,
    characteristics: ['ツアープロ仕様', '操作性抜群', '上級者専用'],
    price: 42000,
    amazonUrl: 'https://amazon.co.jp/dp/B08DUMMY008'
  },
  {
    id: 'head-009',
    name: 'Honma TW757 Driver',
    brand: 'Honma',
    type: 'driver',
    loft: 10.0,
    characteristics: ['高級感', '職人技', '日本製'],
    price: 75000,
    amazonUrl: 'https://amazon.co.jp/dp/B08DUMMY009'
  },
  {
    id: 'head-010',
    name: 'Cleveland Launcher XL Driver',
    brand: 'Cleveland',
    type: 'driver',
    loft: 12.0,
    characteristics: ['大型ヘッド', '初心者安心', '高打ち出し'],
    price: 38000,
    amazonUrl: 'https://amazon.co.jp/dp/B08DUMMY010'
  }
];

// ダミーのシャフトデータ（10種類）
export const shafts: Shaft[] = [
  {
    id: 'shaft-001',
    name: 'Fujikura Speeder NX',
    brand: 'Fujikura',
    flex: 'S',
    weight: 67,
    torque: 3.2,
    kickPoint: 'mid',
    characteristics: ['バランス重視', '中調子', 'オールラウンド'],
    price: 35000,
    amazonUrl: 'https://amazon.co.jp/dp/B08SHFT001'
  },
  {
    id: 'shaft-002',
    name: 'Mitsubishi Diamana RF',
    brand: 'Mitsubishi',
    flex: 'R',
    weight: 62,
    torque: 3.8,
    kickPoint: 'mid',
    characteristics: ['しなり感', '飛距離重視', 'アマチュア向け'],
    price: 32000,
    amazonUrl: 'https://amazon.co.jp/dp/B08SHFT002'
  },
  {
    id: 'shaft-003',
    name: 'Graphite Design Tour AD DI',
    brand: 'Graphite Design',
    flex: 'X',
    weight: 72,
    torque: 2.8,
    kickPoint: 'low',
    characteristics: ['低弾道', 'ハードヒッター向け', '手元調子'],
    price: 38000,
    amazonUrl: 'https://amazon.co.jp/dp/B08SHFT003'
  },
  {
    id: 'shaft-004',
    name: 'UST Mamiya ATTAS',
    brand: 'UST Mamiya',
    flex: 'S',
    weight: 65,
    torque: 3.5,
    kickPoint: 'high',
    characteristics: ['高弾道', '先調子', 'スイングアップ'],
    price: 33000,
    amazonUrl: 'https://amazon.co.jp/dp/B08SHFT004'
  },
  {
    id: 'shaft-005',
    name: 'TRUE TEMPER Dynamic Gold',
    brand: 'TRUE TEMPER',
    flex: 'S',
    weight: 130,
    torque: 2.0,
    kickPoint: 'low',
    characteristics: ['スチール製', '重量級', 'パワーヒッター'],
    price: 15000,
    amazonUrl: 'https://amazon.co.jp/dp/B08SHFT005'
  },
  {
    id: 'shaft-006',
    name: 'Aldila Rogue Silver',
    brand: 'Aldila',
    flex: 'A',
    weight: 58,
    torque: 4.2,
    kickPoint: 'mid',
    characteristics: ['軽量', 'シニア向け', '振りやすさ'],
    price: 28000,
    amazonUrl: 'https://amazon.co.jp/dp/B08SHFT006'
  },
  {
    id: 'shaft-007',
    name: 'Project X HZRDUS',
    brand: 'Project X',
    flex: 'X',
    weight: 75,
    torque: 2.5,
    kickPoint: 'low',
    characteristics: ['超ハード', 'ツアープロ仕様', '上級者専用'],
    price: 40000,
    amazonUrl: 'https://amazon.co.jp/dp/B08SHFT007'
  },
  {
    id: 'shaft-008',
    name: 'Tensei CK Pro Orange',
    brand: 'Mitsubishi',
    flex: 'R',
    weight: 60,
    torque: 3.6,
    kickPoint: 'mid',
    characteristics: ['オレンジ', 'カウンターバランス', '安定性'],
    price: 36000,
    amazonUrl: 'https://amazon.co.jp/dp/B08SHFT008'
  },
  {
    id: 'shaft-009',
    name: 'Oban Kiyoshi Purple',
    brand: 'Oban',
    flex: 'S',
    weight: 68,
    torque: 3.0,
    kickPoint: 'high',
    characteristics: ['日本設計', '美しい塗装', '先端技術'],
    price: 45000,
    amazonUrl: 'https://amazon.co.jp/dp/B08SHFT009'
  },
  {
    id: 'shaft-010',
    name: 'Matrix Ozik HD',
    brand: 'Matrix',
    flex: 'L',
    weight: 52,
    torque: 4.8,
    kickPoint: 'high',
    characteristics: ['超軽量', '女性向け', '高打ち出し'],
    price: 25000,
    amazonUrl: 'https://amazon.co.jp/dp/B08SHFT010'
  }
];

import { golfDB } from '$lib/database/pglite.js';
import type { SwingData, SwingAnalysis } from '$lib/api/gemini.js';

// スイングデータからプロファイルを作成する関数
function createSwingProfile(swingData: SwingData, analysis?: SwingAnalysis) {
  // ジャイロデータから特徴を抽出
  const maxGyro = Math.max(
    ...swingData.gyroscope.x.map(Math.abs),
    ...swingData.gyroscope.y.map(Math.abs),
    ...swingData.gyroscope.z.map(Math.abs)
  );

  const maxAccel = Math.max(
    ...swingData.accelerometer.x.map(Math.abs),
    ...swingData.accelerometer.y.map(Math.abs),
    ...swingData.accelerometer.z.map(Math.abs)
  );

  // パワーレベル計算（1-10）
  const powerLevel = Math.min(10, Math.max(1, Math.floor(maxGyro / 3)));
  
  // 一貫性計算（1-10）
  const gyroVariation = calculateVariation(swingData.gyroscope.x);
  const consistency = Math.min(10, Math.max(1, 10 - Math.floor(gyroVariation / 2)));
  
  // テンポ判定
  let tempo: 'fast' | 'medium' | 'slow' = 'medium';
  if (swingData.duration < 1000) tempo = 'fast';
  else if (swingData.duration > 2000) tempo = 'slow';
  
  // スイングタイプ判定
  let swingType: 'aggressive' | 'smooth' | 'balanced' = 'balanced';
  if (maxGyro > 25) swingType = 'aggressive';
  else if (maxGyro < 8) swingType = 'smooth';

  // スムーズネス計算
  const avgAccel = swingData.accelerometer.x.reduce((a, b) => a + b, 0) / swingData.accelerometer.x.length;
  const variance = swingData.accelerometer.x.reduce((sum, acc) => sum + Math.pow(acc - avgAccel, 2), 0) / swingData.accelerometer.x.length;
  const smoothness = Math.max(0, 100 - Math.sqrt(variance));

  return {
    power_level: powerLevel,
    consistency: consistency,
    tempo: tempo,
    swing_type: swingType,
    max_acceleration: maxAccel,
    max_rotation_rate: maxGyro,
    swing_duration: swingData.duration,
    smoothness: smoothness
  };
}

function calculateVariation(data: number[]): number {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  return Math.sqrt(variance);
}

// PGliteを使った推奨組み合わせ生成関数
export async function generateRecommendations(swingData: SwingData, analysis?: SwingAnalysis): Promise<Combination[]> {
  try {
    // データベースを初期化
    await golfDB.initialize();
    
    // スイングプロファイルを作成
    const profileData = createSwingProfile(swingData, analysis);
    const profileId = await golfDB.createSwingProfile(profileData);
    
    // PGliteから推奨組み合わせを取得
    const recommendations = await golfDB.getRecommendations(profileId, 3);
    
    // 既存のCombination型に変換
    return recommendations.map(rec => ({
      id: rec.id,
      head: rec.head,
      shaft: rec.shaft,
      reason: rec.reason,
      expectedEffect: rec.expected_effect,
      compatibility: rec.compatibility_score
    }));
    
  } catch (error) {
    console.error('❌ Failed to generate recommendations:', error);
    
    // フォールバック: 従来のロジック
    return [
      {
        id: 'combo-fallback-001',
        head: clubHeads[0],
        shaft: shafts[1],
        reason: 'システムエラーのため基本的な組み合わせを表示しています',
        expectedEffect: '安定したパフォーマンス',
        compatibility: 7
      }
    ];
  }
}