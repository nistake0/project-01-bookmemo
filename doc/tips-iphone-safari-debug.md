# Tips: MacでiPhoneのSafariのコンソールログを確認する方法

MacとiPhoneをUSBケーブルで接続することで、MacのSafariのWebインスペクタ機能を使って、iPhoneのSafariで表示しているウェブページのコンソールログや通信内容、HTML/CSSなどをリアルタイムでデバッグすることができる。

## 手順

### Step 1: iPhone側の設定

1.  iPhoneの「設定」アプリを開く。
2.  「Safari」>「詳細」の順にタップして進む。
3.  「Webインスペクタ」のトグルをオン（緑色）にする。

![iPhoneのWebインスペクタ設定](https://developer.apple.com/library/archive/documentation/AppleApplications/Conceptual/Safari_Developer_Guide/Art/ios_web_inspector_2x.png)

*(画像引用元: Apple Developer Documentation)*

### Step 2: Mac側の設定

1.  Macで「Safari」を起動する。
2.  メニューバーから「Safari」>「設定...」（または「環境設定...」）を選択する。
3.  「詳細」タブを開く。
4.  一番下にある「メニューバーに"開発"メニューを表示」のチェックボックスにチェックを入れる。

![MacのSafariの開発メニュー設定](https://developer.apple.com/library/archive/documentation/AppleApplications/Conceptual/Safari_Developer_Guide/Art/safari_advanced_preferences_2x.png)

*(画像引用元: Apple Developer Documentation)*

### Step 3: 接続とデバッグ

1.  iPhoneとMacを**USBケーブルで接続**する。
    -   iPhoneの画面に「このコンピュータを信頼しますか？」という確認ダイアログが表示された場合は、「信頼」をタップする。
2.  MacのSafariで、メニューバーに新しく表示された「開発」メニューをクリックする。
3.  メニューリストの中に、接続されているiPhoneの名前が表示されるので、そこにマウスカーソルを合わせる。
4.  隣に、iPhoneのSafariで現在開かれているウェブページのURL（例: `https://192.168.3.14:5173/`）が表示されるので、それをクリックする。
5.  クリックすると、Macの画面上にそのページ専用のWebインスペクタが起動し、コンソールログなどを確認できるようになる。 