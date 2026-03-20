# 読書カード（xlsx）→ Firestore インポートツール — 実装・運用メモ

次回セッションで仕様変更や不具合修正に入る際の参照用。**コマンドの早見表**は [`scripts/import-reading-card/README.md`](../scripts/import-reading-card/README.md) を優先してよい。本文は **設計・モジュール境界・注意点** を補足する。

---

## 1. 全体像

```
読書カード.xlsx
    │
    ├─ npm run import:preview  (preview.mjs)
    │       ├─ loadImportEnvFiles → .env.local / .env
    │       ├─ extractRaw (parseXlsx) → 年シート行 + メモシート
    │       ├─ buildImportBundle (buildBundle.mjs)
    │       │       ├─ enrichWithGoogle → 書籍キーごとに searchBook (googleBooks.mjs)
    │       │       └─ メモシート行 → 書籍に memos 付与 / スタブ __orphan__
    │       └─ import-bundle.json, import-report.md, （--verbose で）import-debug.log
    │
    ├─ npm run import:enrich-stubs  (enrichStubBooks.mjs)
    │       └─ スタブのみ searchBook で resolved / googleBooks 上書き
    │
    └─ npm run import:apply  (apply.mjs)
            └─ Firestore books + memos コレクションへ batch書き込み
```

- **API キー**: `GOOGLE_BOOKS_API_KEY` または `VITE_GOOGLE_BOOKS_API_KEY`。Referer 制限キーは `GOOGLE_BOOKS_API_HTTP_REFERER`（または `VITE_*`）。
- **生成物** `import-output/` は `.gitignore` でコミットされない。

---

## 2. ファイル一覧と責務

| パス | 役割 |
|------|------|
| `scripts/import-reading-card/preview.mjs` | CLI エントリ。xlsx 読み込み、`buildImportBundle` 呼び出し、JSON/レポート書き出し。 |
| `scripts/import-reading-card/buildBundle.mjs` | 年シートグルーピング、Google 付与、メモ付与、スタブ生成、`report` / stderr。 |
| `scripts/import-reading-card/parseXlsx.mjs` | ワークブック走査、`parseYearRow` / `parseMemoRow`、`parseMemoNameCell`、`parseMemoRateFromCell`、`collapseBookTitleForSearch` 利用（年は `utils` 経由）。 |
| `scripts/import-reading-card/googleBooks.mjs` | `searchBook`, `fetchVolumes`, ISBN 決め打ち（鹿の王・時の子供たち 上/下・他）、`volumeToBook`。 |
| `scripts/import-reading-card/utils.mjs` | `norm`, `makeBookKey`, `cell`, `headerToMap`, **`collapseBookTitleForSearch`**（年シート名の改行→空白）。 |
| `scripts/import-reading-card/apply.mjs` | `import-bundle.json` → Firestore（`serviceAccountKey.json`）。メモに `storyTitle` / `volumeLabel` を条件付きで保存。 |
| `scripts/import-reading-card/enrichStubBooks.mjs` | バンドル内スタブだけ再検索・上書き。 |
| `scripts/import-reading-card/loadEnv.mjs` | Node 直実行時に `.env.local` → `.env` を `process.env` へ（未設定キーのみ）。 |
| `scripts/import-reading-card/debugLog.mjs` | Google URL のキー伏せなど。 |

**削除済み**: テキスト色ベース rating 用 `xlsxMemoColors.mjs`（`rate` 列のみのため）。

---

## 3. 実装詳細（要点）

### 3.1 年シート（`extractRaw` / `parseYearRow`）

- シート名が `^\d{4}$` かつヘッダに **`名前`**。
- **`名前`**: `collapseBookTitleForSearch` 適用後に空でなければ行採用。検索・`makeBookKey(title, author)` もこの1行化文字列基準。
- 列: `著者`, `読み終わった日`, `感想`, 任意 **`きっかけ`**。
- `きっかけ` が非空のとき、バンドル内で **quote メモ**（`tags: ['きっかけ']`）が **感想メモに追加**で付く（`mergeYearGroup` → `enrichWithGoogle`）。

### 3.2 メモシート（`parseMemoRow` / `parseMemoNameCell`）

- ヘッダ: `名前`, `年`, `メモ` または `引用`。任意 **`rate`**。
- **`名前`**: 末尾 `（再読）` 除去 → 改行 or `\s+-\s+` で前半=書籍名、後半= **`storyTitle`** → 書籍名末尾の全角1桁を **`volumeLabel`** / 検索用 `googleSearchTitle`（`書名 ５`）。
- **rating**: `rate` 列の 1〜5 のみ。空・不正・列なしは `0`。色は使わない。
- 年シートと一致しない場合 **`__orphan__{bookTitleNorm}`** スタブ。`sources` は行追加のたび `push`。

### 3.3 `buildBundle.mjs`

- `groupYearRows` → `mergeYearGroup`（`kansous`, **`kikkakes`** 付き）。
- **`enrichWithGoogle`**: キー未設定 / API エラー / 0件は **`report.warnings`** と **`stderrBookUnresolvable`**。
- メモ側スタブ・`--limit` スキップ時も stderr。
- Quote メモ: `storyTitle` / `volumeLabel` をバンドルに含む。

### 3.4 `googleBooks.mjs`

- 入力タイトルは先頭で **`collapseBookTitleForSearch`**。
- **ISBN 先行**: `forcedIsbnTokiNoKodomotachi`（時の子供たち+上/下）→ `FORCED_ISBN_BY_BASE_TITLE_NORM.get(baseTitleNormForIsbnHint(t))`。
- `baseTitleNormForIsbnHint`: 折り畳み → `（再読）` 除去 → 末尾全角1桁除去 → `norm`。
- `searchBook`: 複数 `q`（intitle / inauthor バリエーション）、`pickBestMatch` でスコア最大。
- `403` 時はログにヒント（Referer）。

### 3.5 `apply.mjs`

- 書籍: `resolved.*` および `finishedAt` 等を `books` ドキュメントに。
- メモ: `text`, `comment`, `page`, `tags`, `rating`, ある場合のみ `storyTitle`, `volumeLabel`。

### 3.6 バンドル JSON（概形）

- `version`, `generatedAt`, `books[]`, `report.warnings`, `report.skippedMemos`。
- 各 book: `key`, `isStub?`, `spreadsheet`, `googleBooks`, `resolved`, `memos[]`, `displayTitleNorm` 等。

---

## 4. 使い方（概要）

詳細コマンドは [`scripts/import-reading-card/README.md`](../scripts/import-reading-card/README.md)。

1. `.env.local` に API キー（＋必要なら Referer）。
2. `npm run import:preview -- --input "…読書カード.xlsx" --out ./import-output`
3. `import-bundle.json` / `import-report.md` を確認。スタブは `__orphan__` / `isStub`。
4. 任意: `npm run import:enrich-stubs -- --bundle …`
5. `npm run import:apply -- --bundle … --uid <Firebase UID>`

---

## 5. TODO（優先度）

### P0 — 最優先

- [ ] **外部からの書籍・メモインポート作業が途中である**  
  - Google Books API の日次上限・手元のプレビュー/apply の進捗を踏まえ、**残タスク**（未プレビュー、未 apply、スタブのみ残っているISBN 等）を次回最初に確認・継続すること。

### P1 — キャッシュ（未実装）

- [ ] **Google Books API で成功したリクエストのキャッシュ**  
  - **目的**: 同じ検索クエリ（または論理的に同じ書籍解決）の **2回目以降は API を呼ばない**（クォータ節約・オフライン再実行）。  
  - **想定**  
    - キー: 正規化した `q` 文字列、または `isbn:…`、レスポンスは **ヒットした volume の JSON 断片**（または `volumeId` + キャッシュ済み `volumeToBook` 結果）。  
    - **保存先**: リポジトリに含めない **dot ファイル**（例: プロジェクト直下 `.google-books-api-cache.json`）。  
  - **git**: `.gitignore` に明示エントリを追加済み（下記）。実装時は **書き込み直前で flush**、失敗時はキャッシュ無視で従来どおり API。  
  - **注意**: 0件・エラーはキャッシュしない／TTL 方針は要検討。

---

## 6. 変更履歴メモ（運用向け）

- rating は **`rate` 列のみ**（テキスト色ロジックは削除済み）。
- stderr に「書籍未確定」を明示（書籍シート / メモスタブ / enrich-stubs）。
- 年シート名の改行は空白化。`きっかけ` メモ。ISBN 決め打ち一覧は `googleBooks.mjs` と README を参照。

---

## 7. 関連ドキュメント

- [`scripts/import-reading-card/README.md`](../scripts/import-reading-card/README.md) — コマンド・トラブル（403）の早見表
