# WorkMate - 勤怠管理・タスク追跡アプリ

シンプルで実用的な勤怠管理・タスク追跡アプリ。医療系事務職パート勤務者向けに最適化されています。

## 機能

### シフト管理
- カレンダービューでの直感的なシフト確認
- 3タップ以内でシフト登録完了
- 休憩時間の自動計算（労働基準法準拠）
- 時給履歴管理（変更日を境に自動で計算式を切り替え）

### 103万円年間収入トラッカー
- 現在の年間累計収入をリアルタイム表示
- 103万円までの残り金額を一目で確認
- 月平均から算出した年末予測収入
- 超過予測時の警告表示

### 給与計算
- 月別給与の自動計算
- 深夜手当（22:00-05:00は1.25倍）対応
- 交通費の別枠管理（非課税）

### タスク管理（Redmine風）
- タスクの作成・編集・削除
- ステータス管理：未着手 / 進行中 / 完了 / 保留
- 優先度設定：高 / 中 / 低
- タイムスタンプ付きコメント機能
- アクティビティタイムライン表示

### データ管理
- JSONバックアップ/インポート
- シフトのカレンダーエクスポート（.ics）

## 技術スタック

- **フレームワーク**: React Native + Expo SDK 52
- **言語**: TypeScript (strict mode)
- **状態管理**: Zustand
- **ローカルDB**: expo-sqlite (SQLite)
- **UI**: React Native Paper (Material Design 3)
- **カレンダー**: react-native-calendars
- **CI/CD**: GitHub Actions + EAS Build

## セットアップ

### 前提条件
- Node.js 18以上
- npm または yarn
- Expo CLI
- （iOS開発の場合）macOS + Xcode

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/workmate.git
cd workmate

# 依存関係をインストール
npm install --legacy-peer-deps

# 開発サーバーを起動
npm start
```

### 開発

```bash
# Androidで実行
npm run android

# iOSで実行（macOSのみ）
npm run ios

# Webで実行
npm run web
```

## ビルド

### APKビルド（ローカル）

```bash
# ネイティブコードを生成
npx expo prebuild --platform android --clean

# APKをビルド
cd android
./gradlew assembleRelease

# APKは android/app/build/outputs/apk/release/app-release.apk に出力されます
```

### CI/CDでのビルド

GitHubにプッシュすると自動的にビルドが実行されます：
- `main`ブランチへのプッシュ：APKビルド
- `v*`タグのプッシュ：APKビルド + GitHubリリース作成

※EAS CLIは使用せず、Expo prebuild + Gradleでビルドします。

## ディレクトリ構成

```
├── app/                    # Expo Router screens
│   ├── (tabs)/            # タブ画面
│   │   ├── index.tsx      # ホーム
│   │   ├── shifts.tsx     # シフト一覧
│   │   ├── tasks.tsx      # タスク一覧
│   │   └── settings.tsx   # 設定
│   ├── shift/[id].tsx     # シフト詳細
│   └── task/[id].tsx      # タスク詳細
├── src/
│   ├── components/        # UIコンポーネント
│   ├── db/                # SQLite操作
│   ├── stores/            # Zustand stores
│   ├── theme/             # テーマ設定
│   ├── types/             # TypeScript型定義
│   └── utils/             # ユーティリティ
└── .github/workflows/     # CI/CD設定
```

## ライセンス

MIT License

## 作者

あなたのお名前

