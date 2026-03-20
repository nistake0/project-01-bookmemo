# 背景画像 (backgrounds)

アプリの背景として使用する画像・パターンを配置するフォルダです。
他アセット（icons, manifest 等）とは分離して管理します。

## ファイル一覧

| ファイル | 説明 |
|---------|------|
| library.jpg | 図書館の写真（ウェルズ大聖堂） |
| library-pattern.svg | 図書館テーマ用パターン |
| bookshelf.jpg | 本棚の写真（プレースホルダー） |

## 画像の追加方法

1. このフォルダに画像ファイル（jpg, png, webp 等）を配置
2. `src/theme/backgroundPresets.js` の `BACKGROUND_PRESET_IDS` と `getBackgroundPresets` にプリセットを追加
