# デザイン修正用ブランチ作成

アート修正を始める前に、以下を**手動で**実行してください。

```bash
git checkout -b feat/design-library-background
```

（IDE のターミナルで bash エラーが出る場合は、PowerShell や外部ターミナルで実行してください。）

---

**背景画像の取得**（未取得時）:

```bash
npm run download-library-bg
```

→ `public/library-background.jpg` に #4（ウェルズ大聖堂）を保存します。
