# 読書カード（xlsx）→ Firestore インポート

**実装の詳細・モジュール構成・TODO（インポート途中・APIキャッシュ案）は [doc/import-reading-card-tooling.md](../../doc/import-reading-card-tooling.md) を参照。**

2段階で運用します。

1. **preview** — Excel を読み、`import-bundle.json` と `import-report.md` を生成（確認・編集用）
2. **apply** — バンドルを Firestore に書き込み（`serviceAccountKey.json` と対象ユーザーの UID が必要）

## 対象ファイル構成

- **シート名が 4 桁年のみ**（例: `2025`, `2017`）… その年の読了リスト
  - 列: `名前`, `著者`, `読み終わった日`, `感想`, `きっかけ`（任意・D列想定だが列名で検出）
  - `名前` に改行が含まれる場合は **空白に置き換えて1行**にしてから Google Books 検索・キー化する（単語が分かれてヒットしやすくなる）
- **メモシート** … 1行目に `年`, `名前`, `メモ`, `引用`, `ページ`, `追記` に加え **`rate`（任意・推奨）** を含む表（実データでは `イロイロ引用`）。`rate` 列があるときは 1〜5 の数値で星評価。空・不正な値は **未評価（0）**。
- **`名前` 列のルール** … 末尾の `（再読）` は無視。改行または **半角 `-` の前後に空白** がある形式（例: `地雷グリコ - 坊主衰弱`）では、前半を**書籍名**、後半をメモ JSON の **`storyTitle`**（章題など）に格納。末尾が**全角1桁**（例: `坂の上の雲５`）のときはそれを **`volumeLabel`**（巻）、書籍名からは除き、Google Books 検索用の題名は `書名 ５` のように区切る。同一書籍名に収束する行は **同じ書籍エントリに名寄せ**（スタブも `__orphan__` キーは正規化後の書籍名基準）。

## マッピング

| 来源 | アプリ |
|------|--------|
| 年シート 1 行 | 書籍 1 件（`status: finished`, `finishedAt` は読了日または年の1/1） |
| 年シート `感想`（非空） | メモ 1 件: `text` = 感想, `comment` = 空, `tags` = `["感想文"]` |
| 年シート `きっかけ`（非空） | メモ 1 件: `text` = セル全文（引用として）, `tags` = `["きっかけ"]` |
| イロイロ引用 | `text` = 引用（無ければメモ本文）, `comment` = メモ＋追記, `page` は任意。`名前` の分解結果で `storyTitle` / `volumeLabel` を付与（Firestore のメモドキュメントに保存） |
| Google Books | **タイトル単体のキーワード** → `intitle:` → `intitle`+`inauthor`（表の著者・スペース除去・苗字のみ等）の順で検索。`langRestrict=ja` で 0 件なら制限なしで再試行。返却一覧からタイトル・著者の一致度で**最良候補**を採用（API の「先頭1件」だけに依存しない） |
| メモの rating | **`rate` 列の数値のみ**（1〜5）。空・欠損・1〜5以外・**`rate` 列が無い**場合は **0（未評価）**。引用／メモの**テキスト色は一切使いません**。`--verbose` で行ごとの rating を確認できます。 |

年シートに無い書名のイロイロ引用だけは、**スタブ書籍**（著者なし・そのメモのみ）になります。プレビューで `import-report.md` を確認してください。

バンドル上は `key` が `__orphan__…`・`isStub: true`（`googleBooks.message` が `stub (memo only)`）で識別できます。後から **Google Books をスタブだけに再適用**して書誌を埋める場合:

```bash
# 既定: import-bundle.json を上書き
npm run import:enrich-stubs -- --bundle import-output/import-bundle.json
# 別名保存
npm run import:enrich-stubs -- --bundle import-output/import-bundle.json --out import-output/import-bundle.enriched.json
# 検索の詳細ログ
npm run import:enrich-stubs -- --bundle import-output/import-bundle.json --verbose
# スタブ件数だけ確認（API もファイルも触れない）
npm run import:enrich-stubs -- --bundle import-output/import-bundle.json --dry-run
```

ヒットしたスタブは **`resolved` / `googleBooks` が上書き**され、`isStub` が `false` になります。**`key` とメモはそのまま**（既に年シートにある別エントリと ISBN が重複しても、バンドル上は別書籍のまま）。

## コマンド

```bash
# プレビュー（API キーは .env 等で VITE_GOOGLE_BOOKS_API_KEY または GOOGLE_BOOKS_API_KEY）
npm run import:preview -- --input "D:/path/to/読書カード.xlsx" --out ./import-output

# 詳細デバッグログ（Google リクエストURL・レスポンス先頭、メモセル cell.r 全文など）
npm run import:preview -- --input "...xlsx" --out ./import-output --verbose
# または出力先を指定:
npm run import:preview -- --input "...xlsx" --out ./import-output --debug-log D:/tmp/import-debug.log

# Google を呼ばず構造だけ確認
npm run import:preview -- --input "...xlsx" --out ./import-output --skip-google

# 年シート先頭 N 行だけ（イロイロ引用は該当書籍に付くメモのみ。スタブは作らない）
npm run import:preview -- --input "...xlsx" --out ./import-output --limit 20

# 反映（dry-run）
npm run import:apply -- --bundle import-output/import-bundle.json --uid YOUR_UID --dry-run

# 反映（本番）
npm run import:apply -- --bundle import-output/import-bundle.json --uid YOUR_UID
```

`YOUR_UID` は Firebase Authentication のユーザー ID（アプリにログインしているアカウント）。

## Google Books の ISBN 決め打ち

`googleBooks.mjs` で **ISBN 先行検索**する例:

- **鹿の王** → `9784041054895`
- **時の子供たち** のあとに **上**／**下** が続く表記 → `9784801927391` / `9784801927407`
- **華氏451度** → `9784150119553`
- **記憶翻訳者** → `9784488787011`
- **博士の愛した地味な昆虫** → `9784005009169`

ベース題名は **改行を空白へ畳んだ1行**のあと、`（再読）` 除去・末尾全角1桁を除いて norm 一致を見る（マップ用）。

## 書籍が確定できないときの標準エラー出力

プレビュー（`import:preview`）では、書籍シートで Google Books が **キー未設定・APIエラー・0件**、メモで **年シートと一致せずスタブ**（または `--limit` によるスタブ抑止）のとき **`console.error`（stderr）** に理由・クエリ・行番号などを出します。`import:enrich-stubs` でも補完失敗時に stderr に出します。

## Google Books API が 403（`API_KEY_HTTP_REFERRER_BLOCKED`）になるとき

CLI の `fetch` は **Referer ヘッダが送られない**ことがあります。API キーに **HTTP リファラ**制限だけが付いていると、`Requests from referer <empty> are blocked` で失敗します。

`preview.mjs` は起動時に **プロジェクト直下の `.env.local` / `.env`** を読み、`VITE_GOOGLE_BOOKS_API_KEY` などを `process.env` に載せます（既に OS などで設定済みのキーは上書きしません）。

- **推奨**: GCP で **サーバー／IP 制限**など、CLI から使える別キーを作る。  
- **代替**: **`.env.local`** に  
  `GOOGLE_BOOKS_API_HTTP_REFERER=http://localhost:5173/`  
  （または `VITE_GOOGLE_BOOKS_API_HTTP_REFERER`）を書き、GCP の「HTTP リファラ」に同じオリジンを登録する。スクリプトは `Referer` に加え **`Origin`** も付与します。

## 注意

- フルプレビューは行数・Google API 呼び出しが多いため時間がかかります。
- `import-output/` は `.gitignore` に含めています（個人データを含むため）。
- バンドルを手編集した場合は JSON の構造（`books[].memos` 等）を崩さないでください。
