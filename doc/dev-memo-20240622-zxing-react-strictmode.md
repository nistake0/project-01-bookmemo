# React(StrictMode) + zxing/library でのカメラ制御の知見メモ

## 発生した問題

`@zxing/library` を利用したバーコードスキャナーコンポーネントをスマートフォン（特にiOS Safari）で動作させようとした際、複数の問題が発生した。

最終的に最も解決が困難だったのは、スキャン処理が開始されるタイミングで `IndexSizeError: The index is not in the allowed range.` というエラーが断続的に発生する問題だった。

## 原因の特定

デバッグログを仕込んで調査した結果、根本的な原因は **Reactの`StrictMode`** にあることが判明した。

開発モードにおいて、Reactの`StrictMode`はコンポーネントの潜在的な問題を検出するために、意図的に`useEffect`を2回（マウント→アンマウント→再マウント）実行する。

この仕様により、以下のような競合状態が発生していた。

1.  1回目のマウントでカメラのストリーム取得とイベントリスナの設定が行われる。
2.  しかし、その処理が完全に安定する前に、アンマウント処理が走り、リソースのクリーンアップが開始される。
3.  ほぼ同時に2回目のマウント処理が開始され、再度ストリーム取得とイベントリスナ設定が行われる。

この一連の素早い連続処理の中で、クリーンアップと再初期化が中途半端な状態で交錯し、zxingライブラリがビデオ要素の解像度を `0x0` として取得してしまう瞬間が生まれていた。これが `IndexSizeError` の直接の原因だった。

## 最終的な解決策

この`StrictMode`下での競合状態を解決するため、`BarcodeScanner.jsx` の `useEffect` フックに以下の3つの堅牢な対策を施した。

### 1. 完璧なクリーンアップ処理

`useEffect`のクリーンアップ関数（`return`で返す関数）で、中途半端な状態を残さないように、以下の処理を徹底した。

-   `removeEventListener` で設定したイベントリスナーを明示的にすべて削除する。
-   取得したストリームのすべてのトラックを `track.stop()` で停止させる。
-   `video.srcObject = null` で、ビデオ要素とストリームの接続を完全に断ち切る。
-   `reader.reset()` を呼び出し、zxingライブラリのスキャン状態をリセットする。

### 2. スキャン処理の多重実行を防止するフラグ

スキャン処理(`decodeFromStream`)が複数回実行されるのを防ぐため、`useRef`でフラグ（`isScanning`）を用意した。

```javascript
const isScanning = useRef(false);

// ...

if (isScanning.current) {
  return; // 既にスキャン中なら何もしない
}
isScanning.current = true;
// ここで decodeFromStream を実行
```

### 3. 解像度ゼロ状態での実行を防止するガード節

`onplaying` イベントハンドラ内で、スキャンを開始する直前にビデオ要素の解像度をチェックし、もし`0`であれば処理を実行しない「ガード節」を設けた。

```javascript
if (videoElement.videoWidth === 0) {
    return; // 解像度が0ならスキャンしない
}
```

これらの対策により、`StrictMode`による再マウントが発生しても、常にクリーンな状態でコンポーネントが初期化され、タイミング問題が解消された。

## その他の知見

-   **HTTPS化**: スマートフォンからPCのローカル開発サーバーにアクセスしてカメラを使用するには、サーバーのHTTPS化が必須。`@vitejs/plugin-basic-ssl` を利用することで簡単に実現できた。
-   **iOS Safari対策**: iOSのSafariで`<video>`をインライン再生するには `playsInline` 属性が必須だった。 