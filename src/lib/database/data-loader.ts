import { golfDB } from './pglite.js';
import type { ClubHead, Shaft } from './pglite.js';

interface MasterData {
  club_heads: ClubHead[];
  shafts: Shaft[];
}

export async function loadMasterData(): Promise<void> {
  console.log('🚀 マスターデータの読み込みを開始...');
  
  try {
    // データベースを初期化
    await golfDB.initialize();
    
    // 初期化完了の確認（新しいメソッドを使用）
    if (!golfDB.isInitialized()) {
      throw new Error('Database initialization failed - connection not available');
    }
    
    const db = golfDB.getDB();
    if (!db) {
      throw new Error('Database connection is null after initialization');
    }
    
    console.log('📋 データベース初期化完了、マスターデータを読み込み中...');
    
    // マスターデータを読み込み
    const response = await fetch('/master-data.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch master data: ${response.status}`);
    }
    
    const masterData: MasterData = await response.json();
    console.log(`📥 JSONデータ取得完了: ヘッド${masterData.club_heads.length}件, シャフト${masterData.shafts.length}件`);
    
    // 既存データをクリア（テーブル存在確認後）
    await clearExistingDataSafely(db);
    
    // データを投入
    await insertClubHeads(masterData.club_heads);
    await insertShafts(masterData.shafts);
    
    console.log('✅ マスターデータの読み込み完了！');
    console.log(`📊 クラブヘッド: ${masterData.club_heads.length}件`);
    console.log(`🎯 シャフト: ${masterData.shafts.length}件`);
    
  } catch (error) {
    console.error('❌ マスターデータの読み込みに失敗:', error);
    console.error('❌ エラー詳細:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

async function clearExistingDataSafely(db: any): Promise<void> {
  try {
    console.log('🧹 既存データをクリア中...');
    
    // テーブル存在確認とデータクリア
    const tables = ['recommendations', 'swing_profiles', 'shafts', 'club_heads'];
    
    for (const table of tables) {
      try {
        // テーブル存在確認
        const result = await db.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`  📋 ${table}: ${result.rows[0].count}件のデータを確認`);
        
        // データ削除
        await db.query(`DELETE FROM ${table}`);
        console.log(`  🗑️ ${table}: データクリア完了`);
        
      } catch (tableError) {
        console.log(`  ⚠️ ${table}: テーブルが存在しないか、アクセスできません - スキップ`);
        // テーブルが存在しない場合はスキップ（新規データベースの場合）
      }
    }
    
    console.log('✅ 既存データクリア完了');
    
  } catch (error) {
    console.error('❌ データクリアに失敗:', error);
    throw error;
  }
}

async function insertClubHeads(clubHeads: ClubHead[]): Promise<void> {
  try {
    const db = golfDB.getDB();
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    console.log(`🏌️ クラブヘッド ${clubHeads.length}件を投入中...`);
    
    for (let i = 0; i < clubHeads.length; i++) {
      const head = clubHeads[i];
      console.log(`  ${i + 1}/${clubHeads.length}: ${head.brand} ${head.name}`);
      
      await db.query(
        `INSERT INTO club_heads (id, name, brand, type, loft, characteristics, price, amazon_url, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          head.id,
          head.name,
          head.brand,
          head.type,
          head.loft,
          head.characteristics,
          head.price,
          head.amazon_url,
          head.image_url || null
        ]
      );
    }
    
    console.log(`✅ クラブヘッド ${clubHeads.length}件を投入完了`);
    
  } catch (error) {
    console.error('❌ クラブヘッド投入に失敗:', error);
    throw error;
  }
}

async function insertShafts(shafts: Shaft[]): Promise<void> {
  try {
    const db = golfDB.getDB();
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    console.log(`🎯 シャフト ${shafts.length}件を投入中...`);
    
    for (let i = 0; i < shafts.length; i++) {
      const shaft = shafts[i];
      console.log(`  ${i + 1}/${shafts.length}: ${shaft.brand} ${shaft.name} (${shaft.flex})`);
      
      await db.query(
        `INSERT INTO shafts (id, name, brand, flex, weight, torque, kick_point, characteristics, price, amazon_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          shaft.id,
          shaft.name,
          shaft.brand,
          shaft.flex,
          shaft.weight,
          shaft.torque,
          shaft.kick_point,
          shaft.characteristics,
          shaft.price,
          shaft.amazon_url
        ]
      );
    }
    
    console.log(`✅ シャフト ${shafts.length}件を投入完了`);
    
  } catch (error) {
    console.error('❌ シャフト投入に失敗:', error);
    throw error;
  }
}

// 開発用のデータ確認関数
export async function verifyData(): Promise<void> {
  try {
    const db = golfDB.getDB();
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    console.log('📊 データベース確認中...');
    
    const headCount = await db.query('SELECT COUNT(*) as count FROM club_heads');
    const shaftCount = await db.query('SELECT COUNT(*) as count FROM shafts');
    
    console.log('📊 データベース確認結果:');
    console.log(`  クラブヘッド: ${headCount.rows[0].count}件`);
    console.log(`  シャフト: ${shaftCount.rows[0].count}件`);
    
    // サンプルクエリ
    if (headCount.rows[0].count > 0) {
      const sampleHeads = await db.query('SELECT name, brand, price FROM club_heads LIMIT 3');
      console.log('🏌️ サンプルクラブヘッド:');
      sampleHeads.rows.forEach((row: any) => {
        console.log(`  ${row.brand} ${row.name} - ¥${row.price.toLocaleString()}`);
      });
    }
    
    console.log('✅ データベース検証完了');
    
  } catch (error) {
    console.error('❌ データベース検証に失敗:', error);
    throw error;
  }
}