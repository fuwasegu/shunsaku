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

// スイングタイプ別の推奨組み合わせ生成関数
export function generateRecommendations(swingData: any): Combination[] {
  // 実際にはAI解析結果に基づいて組み合わせを選択
  // ここではダミーとして3つの組み合わせを返す
  return [
    {
      id: 'combo-001',
      head: clubHeads[0],
      shaft: shafts[1],
      reason: 'あなたの手首の使い方に最適な組み合わせです',
      expectedEffect: '飛距離アップと方向性の向上',
      compatibility: 9
    },
    {
      id: 'combo-002', 
      head: clubHeads[2],
      shaft: shafts[3],
      reason: 'スイングの軌道を安定させる組み合わせ',
      expectedEffect: 'ミート率向上とブレ軽減',
      compatibility: 8
    },
    {
      id: 'combo-003',
      head: clubHeads[4],
      shaft: shafts[0],
      reason: 'あなたのタイミングに合わせた設計',
      expectedEffect: '打感向上と一貫性アップ',
      compatibility: 7
    }
  ];
}