# 背景画像 (backgrounds)

アプリの背景として使用する画像を配置するフォルダです。
他アセット（icons, manifest 等）とは分離して管理します。

## ファイル一覧

| ファイル | 説明 |
|---------|------|
| bg-01.jpg | NYPL・ローズ閲覧室 |
| bg-02.jpg | 茶色の木製書棚 |
| bg-03.jpg | ストックホルム市立図書館 |
| bg-04.jpg | ウェルズ大聖堂図書館 |
| bg-05.jpg | ノルウェー国立図書館 |
| bg-06.jpg | ヴィンテージ図書館 |
| bg-07.jpg | 古い図書館室内 |
| bg-08.jpg | ヴィンテージ図書館 |
| bg-09.jpg | はしご付き書棚 |
| bg-10.jpg | ノルウェー国立図書館・別アングル |
| library-pattern.svg | 図書館テーマ用パターン（後方互換） |

## 画像の取得方法

```bash
npm run download-backgrounds
```

`doc/design-image-candidates.md` の候補 #1-#10 を Unsplash から取得します。

## 画像の追加方法

1. このフォルダに画像ファイル（jpg, png, webp 等）を配置
2. `src/theme/backgroundPresets.js` の `BACKGROUND_PRESET_IDS` と `CANDIDATES` にプリセットを追加
