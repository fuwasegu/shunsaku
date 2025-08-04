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
    
    // 既存のダミーデータをクリア
    await clearExistingData();
    
    // マスターデータを読み込み
    const response = await fetch('/master-data.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch master data: ${response.status}`);
    }
    
    const masterData: MasterData = await response.json();
    
    // データを投入
    await insertClubHeads(masterData.club_heads);
    await insertShafts(masterData.shafts);
    
    console.log('✅ マスターデータの読み込み完了！');
    console.log(`📊 クラブヘッド: ${masterData.club_heads.length}件`);
    console.log(`🎯 シャフト: ${masterData.shafts.length}件`);
    
  } catch (error) {
    console.error('❌ マスターデータの読み込みに失敗:', error);
    throw error;
  }
}

async function clearExistingData(): Promise<void> {
  const db = (golfDB as any).db;
  if (!db) throw new Error('Database not initialized');
  
  // リレーション順序を考慮して削除
  await db.query('DELETE FROM recommendations');
  await db.query('DELETE FROM swing_profiles');
  await db.query('DELETE FROM shafts');
  await db.query('DELETE FROM club_heads');
  
  console.log('🧹 既存データをクリアしました');
}

async function insertClubHeads(clubHeads: ClubHead[]): Promise<void> {
  const db = (golfDB as any).db;
  if (!db) throw new Error('Database not initialized');
  
  for (const head of clubHeads) {
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
  
  console.log(`📥 クラブヘッド ${clubHeads.length}件を投入しました`);
}

async function insertShafts(shafts: Shaft[]): Promise<void> {
  const db = (golfDB as any).db;
  if (!db) throw new Error('Database not initialized');
  
  for (const shaft of shafts) {
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
  
  console.log(`📥 シャフト ${shafts.length}件を投入しました`);
}

// 開発用のデータ確認関数
export async function verifyData(): Promise<void> {
  const db = (golfDB as any).db;
  if (!db) throw new Error('Database not initialized');
  
  const headCount = await db.query('SELECT COUNT(*) as count FROM club_heads');
  const shaftCount = await db.query('SELECT COUNT(*) as count FROM shafts');
  
  console.log('📊 データベース確認:');
  console.log(`  クラブヘッド: ${headCount.rows[0].count}件`);
  console.log(`  シャフト: ${shaftCount.rows[0].count}件`);
  
  // サンプルクエリ
  const sampleHeads = await db.query('SELECT name, brand, price FROM club_heads LIMIT 3');
  console.log('🏌️ サンプルクラブヘッド:');
  sampleHeads.rows.forEach((row: any) => {
    console.log(`  ${row.brand} ${row.name} - ¥${row.price.toLocaleString()}`);
  });
}