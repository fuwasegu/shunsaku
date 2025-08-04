-- ゴルフクラブ推奨システム - PGlite スキーマ
-- ==========================================================================

-- 後でpgvector拡張を追加予定
-- CREATE EXTENSION IF NOT EXISTS vector;

-- クラブヘッドテーブル
CREATE TABLE club_heads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('driver', 'fairway', 'iron', 'wedge', 'putter')),
  loft DECIMAL(4,1) NOT NULL,
  characteristics TEXT[] NOT NULL,
  price INTEGER NOT NULL,
  amazon_url TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- シャフトテーブル
CREATE TABLE shafts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  flex TEXT NOT NULL CHECK (flex IN ('L', 'A', 'R', 'S', 'X')),
  weight INTEGER NOT NULL,
  torque DECIMAL(3,1) NOT NULL,
  kick_point TEXT NOT NULL CHECK (kick_point IN ('low', 'mid', 'high')),
  characteristics TEXT[] NOT NULL,
  price INTEGER NOT NULL,
  amazon_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- スイングプロファイルテーブル（解析結果）
CREATE TABLE swing_profiles (
  id TEXT PRIMARY KEY,
  power_level INTEGER NOT NULL CHECK (power_level BETWEEN 1 AND 10),
  consistency INTEGER NOT NULL CHECK (consistency BETWEEN 1 AND 10),
  tempo TEXT NOT NULL CHECK (tempo IN ('fast', 'medium', 'slow')),
  swing_type TEXT NOT NULL CHECK (swing_type IN ('aggressive', 'smooth', 'balanced')),
  max_acceleration DECIMAL(6,2),
  max_rotation_rate DECIMAL(6,2),
  swing_duration DECIMAL(6,2),
  smoothness DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 推奨組み合わせテーブル
CREATE TABLE recommendations (
  id TEXT PRIMARY KEY,
  swing_profile_id TEXT REFERENCES swing_profiles(id),
  head_id TEXT REFERENCES club_heads(id),
  shaft_id TEXT REFERENCES shafts(id),
  compatibility_score INTEGER NOT NULL CHECK (compatibility_score BETWEEN 1 AND 10),
  reason TEXT NOT NULL,
  expected_effect TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX idx_club_heads_type ON club_heads(type);
CREATE INDEX idx_club_heads_brand ON club_heads(brand);
CREATE INDEX idx_club_heads_price ON club_heads(price);
CREATE INDEX idx_shafts_flex ON shafts(flex);
CREATE INDEX idx_shafts_weight ON shafts(weight);
CREATE INDEX idx_shafts_brand ON shafts(brand);
CREATE INDEX idx_recommendations_score ON recommendations(compatibility_score DESC);

-- ベクトル検索用のカラム追加（将来の機能）
-- ALTER TABLE club_heads ADD COLUMN characteristics_vector vector(384);
-- ALTER TABLE shafts ADD COLUMN characteristics_vector vector(384);

-- 適合度計算のための関数
CREATE OR REPLACE FUNCTION calculate_compatibility(
  head_chars TEXT[],
  shaft_chars TEXT[],
  power_level INTEGER,
  consistency INTEGER,
  swing_type TEXT
) RETURNS INTEGER AS $$
DECLARE
  base_score INTEGER := 5;
  char_match_bonus INTEGER := 0;
  power_bonus INTEGER := 0;
  consistency_bonus INTEGER := 0;
BEGIN
  -- 特性マッチングボーナス
  IF array_length(head_chars & shaft_chars, 1) > 0 THEN
    char_match_bonus := array_length(head_chars & shaft_chars, 1);
  END IF;
  
  -- パワーレベルボーナス
  IF power_level >= 8 AND 'パワーヒッター向け' = ANY(head_chars) THEN
    power_bonus := 2;
  ELSIF power_level <= 4 AND '初心者向け' = ANY(head_chars) THEN
    power_bonus := 2;
  END IF;
  
  -- 一貫性ボーナス
  IF consistency >= 8 AND '操作性' = ANY(head_chars) THEN
    consistency_bonus := 1;
  ELSIF consistency <= 5 AND '寛容性' = ANY(head_chars) THEN
    consistency_bonus := 2;
  END IF;
  
  RETURN LEAST(10, base_score + char_match_bonus + power_bonus + consistency_bonus);
END;
$$ LANGUAGE plpgsql;

-- 価格帯フィルタリング関数
CREATE OR REPLACE FUNCTION is_price_compatible(
  head_price INTEGER,
  shaft_price INTEGER,
  max_budget INTEGER DEFAULT 200000
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN (head_price + shaft_price) <= max_budget;
END;
$$ LANGUAGE plpgsql;