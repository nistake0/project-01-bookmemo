# Cursor から Git 操作できない（index.lock Permission denied）の対処

エージェント（Composer）がターミナルで `git add` / `git commit` 等を実行すると、次のエラーになることがあります。

```
fatal: Unable to create 'D:/.../project/.git/index.lock': Permission denied
```

**補足**: `.git/index.lock` ファイルが存在しない場合でも、**作成する権限がない**ために同じメッセージが出ます。

---

## 原因

1. **エージェント用ターミナルのサンドボックス**
   - Cursor のエージェントが実行するコマンドは、**サンドボックス内**で動くことがある。
   - サンドボックスでは **「Git への書き込み」がブロック**され、`.git` 配下の作成・更新ができない。

2. **`git_write` 権限時の別エラー**
   - 権限付きで実行すると、環境によっては  
     `Sandbox cannot run from an elevated administrator process`  
     となり、サンドボックスを解除できない。

3. **CreateFileMapping とは別**
   - 統合ターミナルのシェル起動時の `CreateFileMapping` エラーとは別問題。  
     対処は `doc/troubleshooting-createfilemapping-error.md` を参照。

---

## 対処法（試す順）

### 1. サンドボックスを無効にする（User settings）

エージェント用ターミナルのサンドボックスを止めると、`.git` への書き込みが通る可能性があります。

1. **ユーザー設定を開く**
   - `Ctrl + ,` → 「Cursor Settings」または「settings」
   - 右上の **「Open Settings (JSON)」** をクリック  
     （または `%APPDATA%\Cursor\User\settings.json` を直接開く）

2. **次を追加または変更**
   ```json
   "chat.sandboxEnabled": false
   ```
   - 既存の設定と重複しないようにし、JSON の体裁を崩さないこと。

3. **Cursor を再起動**し、エージェントから再度 `git add` / `git commit` を実行して確認。

**注意**: サンドボックス OFF はセキュリティ上ややリスクがあります。信頼するプロジェクトでのみ使用し、`chat.autoRun` は `"askEachTime"` 推奨。

---

### 2. Cursor を管理者権限で起動していないか確認

`git_write` 等の権限付き実行で  
`Sandbox cannot run from an elevated administrator process`  
が出る場合、**Cursor を管理者として起動している**可能性があります。

- Cursor を**通常ユーザー**で起動し直す。
- 再度、エージェントから `git add` / `git commit` を試す。

---

### 3. レガシーターミナルを有効にする（User settings）

従来のターミナル挙動に戻すと、サンドボックス・権限まわりが変わり、改善する場合があります。

`settings.json` に次を追加：

```json
"experimental.legacyTerminalTool": true
```

Cursor 再起動後、再度 git 操作を試す。

---

### 4. プロジェクトで Cursor CLI を使っている場合（`.cursor/cli.json`）

**Cursor CLI**（`cursor` コマンドでエージェントを起動）を使う場合、プロジェクトの権限設定が効くことがあります。

本プロジェクトには **`.cursor/cli.json`** の例を置いてあります：

```json
{
  "permissions": {
    "allow": ["Shell(git)", "Shell(npm)", "Shell(npx)"],
    "deny": []
  }
}
```

- `Shell(git)` で `git` のサブコマンド全体を許可。
- 必要に応じて `allow` に他のコマンドを追加可。

**注意**: この設定は **Cursor CLI** 用です。IDE 内の Composer ターミナルには効かない場合があります。まずは **1. サンドボックス無効化** を試してください。

---

### 5. 手動で Git を実行する（確実な回避策）

上記を試してもエージェントから git が通らない場合は、**手動で Git を実行**する運用にします。

1. **Cursor の統合ターミナル**（`Ctrl + \``）を開く。
2. デフォルトシェルが **PowerShell** になっているか確認。  
   （Git Bash だと CreateFileMapping が出る場合は `doc/troubleshooting-createfilemapping-error.md` を参照。）
3. プロジェクトルートで、例えば：
   ```powershell
   git add src/pages/BookDetail.jsx
   git commit -F commit-msg-recent.txt
   ```
   など、必要な `git` コマンドを自分で実行する。

エージェントには「コミット用のコマンド例と `-F` 用メッセージファイル」を案内してもらい、実行だけ手動にする形にすると確実です。

---

## 設定の場所まとめ

| 種類 | 場所 |
|------|------|
| User settings | `%APPDATA%\Cursor\User\settings.json`（Windows） |
| プロジェクト CLI 設定 | `<プロジェクト>/.cursor/cli.json` |

---

## 関連ドキュメント

- **CreateFileMapping Win32 Error 5**  
  `doc/troubleshooting-createfilemapping-error.md`  
  - 統合ターミナルで Git Bash を使う際のエラーと、PowerShell への切り替え。
