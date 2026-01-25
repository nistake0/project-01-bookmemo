# CreateFileMapping Win32 Error 5 の原因と対処

Cursor の統合ターミナルで `git` 等を実行すると、次のエラーで Bash が落ちることがあります。

```
bash.exe: *** fatal error - CreateFileMapping ... Win32 error 5. Terminating.
```

## 直接原因

1. **デフォルトターミナルが Git Bash**
   - Cursor の `terminal.integrated.defaultProfile.windows` が **"Git Bash"** のとき、統合ターミナルは `bash.exe` を起動する。

2. **Bash の fork と CreateFileMapping**
   - Git Bash（MSYS2）はプロセス fork 時に **CreateFileMapping** / **MapViewOfFileEx** で共有メモリ（`Global\` 名前空間）を使う。
   - そのために **SeCreateGlobalPrivilege**（「グローバル オブジェクトの作成」）が必要。

3. **Error 5 = ACCESS_DENIED**
   - 一般ユーザーには通常この権限が付与されていない。
   - そのため CreateFileMapping が失敗し、Bash が `Win32 error 5` で終了する。

**まとめ**: Git Bash 起動 → fork → 共有メモリ作成 → 権限不足で CreateFileMapping 失敗 → Bash 終了。

## 推奨対処（ターミナルを PowerShell に変更）

**Git Bash を使わず、PowerShell をデフォルトにする。**

- `git` は Git for Windows の `git.exe` で動作するため、PowerShell からそのまま利用できる。
- CreateFileMapping を使うのは **Bash** 側なので、PowerShell にすればこのエラーは出ない。

### 手順

1. **Cursor 設定を開く**
   - `Ctrl + ,` → 検索で `default profile` など
   - または **Terminal: Select Default Profile** で「PowerShell」を選択

2. **settings.json で直接指定する場合**
   - `%APPDATA%\Cursor\User\settings.json` を開く。
   - 次に変更する:
     ```json
     "terminal.integrated.defaultProfile.windows": "PowerShell"
     ```
   - 以前が `"Git Bash"` なら、これに置き換える。

3. **Cursor を再起動**するか、既存ターミナルを閉じて **新規ターミナル**（`` Ctrl+` `` または メニュー Terminal > New Terminal）を開く。
4. `git status` 等を実行し、エラーが出ないことを確認する。

**本プロジェクトでの適用**: Cursor の `settings.json` で `terminal.integrated.defaultProfile.windows` を `"Git Bash"` から `"PowerShell"` に変更済み。

## その他の対処（必要に応じて）

| 対処 | 内容 | 注意 |
|------|------|------|
| **Git CMD** | デフォルトを "Command Prompt" にし、`git-cmd.exe` 経由で Git を使う | Git Bash ではなく CMD 系なので CreateFileMapping を避けられる |
| **管理者で Bash** | Git Bash を「管理者として実行」 | 一時的な回避になり、恒常的な運用には不向き |
| **SeCreateGlobalPrivilege** | ユーザーに「グローバル オブジェクトの作成」を付与 | セキュリティ上のリスクがあり、Microsoft は推奨していない |

## 参考

- **別トラブル（index.lock Permission denied）**: エージェントから `git add` / `git commit` ができない場合は `doc/troubleshooting-cursor-git-permission-denied.md` を参照。
- [Git for Windows #1244](https://github.com/git-for-windows/git/issues/1244) — MapViewOfFileEx Win32 error 5
- [Git for Windows #580](https://github.com/git-for-windows/git/issues/580) — git-bash 失敗時も git-cmd / bash.exe は動く報告
- [Create global objects (Microsoft)](https://learn.microsoft.com/previous-versions/windows/it-pro/windows-10/security/threat-protection/security-policy-settings/create-global-objects) — SeCreateGlobalPrivilege の説明
