# ゴルフクラブマスターデータ フォーマット

## 📝 必要なデータ構造

### 🏌️ クラブヘッド (ClubHead)

```json
{
  "id": "head-001",
  "name": "TaylorMade SIM2 Driver",
  "brand": "TaylorMade",
  "type": "driver",
  "loft": 10.5,
  "characteristics": ["高弾道", "寛容性", "飛距離重視"],
  "price": 58000,
  "amazon_url": "https://amazon.co.jp/dp/B08DUMMY001",
  "image_url": "https://example.com/image.jpg"
}
```

### 🎯 シャフト (Shaft)

```json
{
  "id": "shaft-001",
  "name": "Fujikura Speeder NX",
  "brand": "Fujikura",
  "flex": "S",
  "weight": 67,
  "torque": 3.2,
  "kick_point": "mid",
  "characteristics": ["バランス重視", "中調子", "オールラウンド"],
  "price": 35000,
  "amazon_url": "https://amazon.co.jp/dp/B08SHFT001"
}
```

## 📋 フィールド詳細

### クラブヘッド
| フィールド | 型 | 必須 | 説明 | 例 |
|-----------|---|------|------|---|
| `id` | string | ✅ | 一意識別子 | `"head-taylormade-sim2"` |
| `name` | string | ✅ | 商品名 | `"TaylorMade SIM2 Driver"` |
| `brand` | string | ✅ | ブランド名 | `"TaylorMade"` |
| `type` | string | ✅ | クラブタイプ | `"driver"`, `"fairway"`, `"iron"`, `"wedge"`, `"putter"` |
| `loft` | number | ✅ | ロフト角（度） | `10.5` |
| `characteristics` | string[] | ✅ | 特性リスト | `["高弾道", "寛容性"]` |
| `price` | number | ✅ | 価格（円） | `58000` |
| `amazon_url` | string | ✅ | Amazon商品URL | `"https://amazon.co.jp/dp/XXX"` |
| `image_url` | string | ⭕ | 商品画像URL | `"https://example.com/img.jpg"` |

### シャフト
| フィールド | 型 | 必須 | 説明 | 例 |
|-----------|---|------|------|---|
| `id` | string | ✅ | 一意識別子 | `"shaft-fujikura-speeder"` |
| `name` | string | ✅ | 商品名 | `"Fujikura Speeder NX"` |
| `brand` | string | ✅ | ブランド名 | `"Fujikura"` |
| `flex` | string | ✅ | フレックス | `"L"`, `"A"`, `"R"`, `"S"`, `"X"` |
| `weight` | number | ✅ | 重量（グラム） | `67` |
| `torque` | number | ✅ | トルク | `3.2` |
| `kick_point` | string | ✅ | キックポイント | `"low"`, `"mid"`, `"high"` |
| `characteristics` | string[] | ✅ | 特性リスト | `["中調子", "オールラウンド"]` |
| `price` | number | ✅ | 価格（円） | `35000` |
| `amazon_url` | string | ✅ | Amazon商品URL | `"https://amazon.co.jp/dp/XXX"` |

## 🎨 推奨特性キーワード

### クラブヘッド特性例
```
飛距離重視, 高弾道, 低弾道, 寛容性, 操作性, パワーヒッター向け, 
初心者向け, 中級者向け, 上級者向け, 直進性, 低スピン, 高スピン
```

### シャフト特性例
```
先調子, 中調子, 元調子, 軽量, 重量級, しなり感, 剛性重視, 
オールラウンド, バランス重視, 飛距離重視, 方向性重視, アマチュア向け
```

## 📄 CSVフォーマット例

### club_heads.csv
```csv
id,name,brand,type,loft,characteristics,price,amazon_url,image_url
head-001,TaylorMade SIM2 Driver,TaylorMade,driver,10.5,"高弾道,寛容性,飛距離重視",58000,https://amazon.co.jp/dp/B08DUMMY001,
head-002,Callaway EPIC MAX Driver,Callaway,driver,9.0,"低スピン,パワーヒッター向け,高初速",62000,https://amazon.co.jp/dp/B08DUMMY002,
```

### shafts.csv
```csv
id,name,brand,flex,weight,torque,kick_point,characteristics,price,amazon_url
shaft-001,Fujikura Speeder NX,Fujikura,S,67,3.2,mid,"バランス重視,中調子,オールラウンド",35000,https://amazon.co.jp/dp/B08SHFT001
shaft-002,Mitsubishi Diamana RF,Mitsubishi,R,62,3.8,mid,"しなり感,飛距離重視,アマチュア向け",32000,https://amazon.co.jp/dp/B08SHFT002
```

## 🚀 データ投入方法

データが準備できたら、以下のファイルを作成します：

1. `static/club-heads.json` - クラブヘッドデータ
2. `static/shafts.json` - シャフトデータ

または：

1. `static/club-heads.csv` - クラブヘッドCSV
2. `static/shafts.csv` - シャフトCSV

データ投入用のスクリプトも用意できます！📊
