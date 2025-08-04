import { PGlite } from '@electric-sql/pglite';

// 型定義
export interface ClubHead {
  id: string;
  name: string;
  brand: string;
  type: 'driver' | 'fairway' | 'iron' | 'wedge' | 'putter';
  loft: number;
  characteristics: string[];
  price: number;
  amazon_url: string;
  image_url?: string;
}

export interface Shaft {
  id: string;
  name: string;
  brand: string;
  flex: 'L' | 'A' | 'R' | 'S' | 'X';
  weight: number;
  torque: number;
  kick_point: 'low' | 'mid' | 'high';
  characteristics: string[];
  price: number;
  amazon_url: string;
}

export interface SwingProfile {
  id: string;
  power_level: number;
  consistency: number;
  tempo: 'fast' | 'medium' | 'slow';
  swing_type: 'aggressive' | 'smooth' | 'balanced';
  max_acceleration?: number;
  max_rotation_rate?: number;
  swing_duration?: number;
  smoothness?: number;
}

export interface Recommendation {
  id: string;
  swing_profile_id: string;
  head: ClubHead;
  shaft: Shaft;
  compatibility_score: number;
  reason: string;
  expected_effect: string;
}

class GolfDatabase {
  private db: PGlite | null = null;
  private initialized = false;

  // データベース接続を取得
  getDB(): PGlite | null {
    return this.db;
  }

  // 初期化状態を取得
  isInitialized(): boolean {
    return this.initialized && this.db !== null;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('📋 Database already initialized');
      return;
    }

    try {
      console.log('🚀 PGlite初期化開始...');
      
      // PGliteを初期化
      this.db = new PGlite();
      console.log('✅ PGliteインスタンス作成完了');

      // スキーマを読み込み
      console.log('📋 スキーマファイルを読み込み中...');
      const schemaResponse = await fetch('/schema.sql');
      if (!schemaResponse.ok) {
        throw new Error(`Schema fetch failed: ${schemaResponse.status}`);
      }
      
      const schema = await schemaResponse.text();
      console.log(`📄 スキーマファイル読み込み完了 (${schema.length} characters)`);
      
      console.log('🏗️ スキーマ実行中...');
      await this.db.exec(schema);
      console.log('✅ スキーマ実行完了');

      // 初期データを投入（開発時のダミーデータ）
      // await this.seedData();

      this.initialized = true;
      console.log('🎉 PGlite database initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      this.initialized = false;
      this.db = null;
      throw error;
    }
  }

  private async seedData(): Promise<void> {
    // クラブヘッドの初期データ投入
    const clubHeads = [
      {
        id: 'head-001',
        name: 'TaylorMade SIM2 Driver',
        brand: 'TaylorMade',
        type: 'driver',
        loft: 10.5,
        characteristics: ['高弾道', '寛容性', '飛距離重視'],
        price: 58000,
        amazon_url: 'https://amazon.co.jp/dp/B08DUMMY001'
      },
      {
        id: 'head-002',
        name: 'Callaway EPIC MAX Driver',
        brand: 'Callaway',
        type: 'driver',
        loft: 9.0,
        characteristics: ['低スピン', 'パワーヒッター向け', '高初速'],
        price: 62000,
        amazon_url: 'https://amazon.co.jp/dp/B08DUMMY002'
      },
      {
        id: 'head-003',
        name: 'PING G425 MAX Driver',
        brand: 'PING',
        type: 'driver',
        loft: 10.5,
        characteristics: ['安定性', '直進性', '初心者向け'],
        price: 55000,
        amazon_url: 'https://amazon.co.jp/dp/B08DUMMY003'
      }
      // より多くのデータは後で追加
    ];

    const shafts = [
      {
        id: 'shaft-001',
        name: 'Fujikura Speeder NX',
        brand: 'Fujikura',
        flex: 'S',
        weight: 67,
        torque: 3.2,
        kick_point: 'mid',
        characteristics: ['バランス重視', '中調子', 'オールラウンド'],
        price: 35000,
        amazon_url: 'https://amazon.co.jp/dp/B08SHFT001'
      },
      {
        id: 'shaft-002',
        name: 'Mitsubishi Diamana RF',
        brand: 'Mitsubishi',
        flex: 'R',
        weight: 62,
        torque: 3.8,
        kick_point: 'mid',
        characteristics: ['しなり感', '飛距離重視', 'アマチュア向け'],
        price: 32000,
        amazon_url: 'https://amazon.co.jp/dp/B08SHFT002'
      }
      // より多くのデータは後で追加
    ];

    // データ投入
    for (const head of clubHeads) {
      await this.db!.query(
        `INSERT INTO club_heads (id, name, brand, type, loft, characteristics, price, amazon_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [head.id, head.name, head.brand, head.type, head.loft, head.characteristics, head.price, head.amazon_url]
      );
    }

    for (const shaft of shafts) {
      await this.db!.query(
        `INSERT INTO shafts (id, name, brand, flex, weight, torque, kick_point, characteristics, price, amazon_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [shaft.id, shaft.name, shaft.brand, shaft.flex, shaft.weight, shaft.torque, shaft.kick_point, shaft.characteristics, shaft.price, shaft.amazon_url]
      );
    }
  }

  async createSwingProfile(profileData: Omit<SwingProfile, 'id'>): Promise<string> {
    const id = `profile-${Date.now()}`;
    
    await this.db!.query(
      `INSERT INTO swing_profiles (id, power_level, consistency, tempo, swing_type, max_acceleration, max_rotation_rate, swing_duration, smoothness)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        profileData.power_level,
        profileData.consistency,
        profileData.tempo,
        profileData.swing_type,
        profileData.max_acceleration,
        profileData.max_rotation_rate,
        profileData.swing_duration,
        profileData.smoothness
      ]
    );

    return id;
  }

  async getRecommendations(swingProfileId: string, limit: number = 3): Promise<Recommendation[]> {
    const result = await this.db!.query(`
      WITH profile AS (
        SELECT * FROM swing_profiles WHERE id = $1
      ),
      compatibility_scores AS (
        SELECT 
          h.id as head_id,
          s.id as shaft_id,
          calculate_compatibility(
            h.characteristics, 
            s.characteristics, 
            p.power_level, 
            p.consistency, 
            p.swing_type
          ) as score
        FROM club_heads h
        CROSS JOIN shafts s
        CROSS JOIN profile p
        WHERE is_price_compatible(h.price, s.price, 150000)
      )
      SELECT 
        h.id, h.name as head_name, h.brand as head_brand, h.type, h.loft, 
        h.characteristics as head_characteristics, h.price as head_price, h.amazon_url as head_amazon_url,
        s.id as shaft_id, s.name as shaft_name, s.brand as shaft_brand, s.flex, s.weight,
        s.torque, s.kick_point, s.characteristics as shaft_characteristics, 
        s.price as shaft_price, s.amazon_url as shaft_amazon_url,
        cs.score,
        CASE 
          WHEN cs.score >= 8 THEN 'あなたのスイング特性に非常に適している組み合わせです'
          WHEN cs.score >= 6 THEN 'バランスの良い組み合わせでパフォーマンス向上が期待できます'
          ELSE '基本的な相性は良好で、安定したプレーができるでしょう'
        END as reason,
        CASE 
          WHEN cs.score >= 8 THEN '飛距離アップと方向性の大幅な向上'
          WHEN cs.score >= 6 THEN 'ミート率向上と一貫性アップ'
          ELSE '基本性能の安定化'
        END as expected_effect
      FROM compatibility_scores cs
      JOIN club_heads h ON h.id = cs.head_id
      JOIN shafts s ON s.id = cs.shaft_id
      ORDER BY cs.score DESC, h.price + s.price ASC
      LIMIT $2
    `, [swingProfileId, limit]);

    return result.rows.map(row => ({
      id: `${row.id}-${row.shaft_id}`,
      swing_profile_id: swingProfileId,
      head: {
        id: row.id,
        name: row.head_name,
        brand: row.head_brand,
        type: row.type,
        loft: row.loft,
        characteristics: row.head_characteristics,
        price: row.head_price,
        amazon_url: row.head_amazon_url
      },
      shaft: {
        id: row.shaft_id,
        name: row.shaft_name,
        brand: row.shaft_brand,
        flex: row.flex,
        weight: row.weight,
        torque: row.torque,
        kick_point: row.kick_point,
        characteristics: row.shaft_characteristics,
        price: row.shaft_price,
        amazon_url: row.shaft_amazon_url
      },
      compatibility_score: row.score,
      reason: row.reason,
      expected_effect: row.expected_effect
    }));
  }

  async searchClubHeads(filters: {
    brand?: string;
    type?: string;
    maxPrice?: number;
    characteristics?: string[];
  }): Promise<ClubHead[]> {
    let query = 'SELECT * FROM club_heads WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.brand) {
      query += ` AND brand = $${paramIndex}`;
      params.push(filters.brand);
      paramIndex++;
    }

    if (filters.type) {
      query += ` AND type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }

    if (filters.maxPrice) {
      query += ` AND price <= $${paramIndex}`;
      params.push(filters.maxPrice);
      paramIndex++;
    }

    if (filters.characteristics && filters.characteristics.length > 0) {
      query += ` AND characteristics && $${paramIndex}::text[]`;
      params.push(filters.characteristics);
      paramIndex++;
    }

    query += ' ORDER BY price ASC';

    const result = await this.db!.query(query, params);
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      brand: row.brand,
      type: row.type,
      loft: row.loft,
      characteristics: row.characteristics,
      price: row.price,
      amazon_url: row.amazon_url,
      image_url: row.image_url
    }));
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

// シングルトンインスタンス
export const golfDB = new GolfDatabase();