const fs = require('fs');
const path = require('path');

// SVGをPNGに変換する関数
function convertSvgToPng(svgPath, pngPath, size) {
  return new Promise((resolve, reject) => {
    const { createCanvas, loadImage } = require('canvas');
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // SVGファイルを読み込み
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    
    // SVGをData URLに変換
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
    
    // 画像を読み込み
    loadImage(dataUrl).then((img) => {
      // キャンバスに描画
      ctx.drawImage(img, 0, 0, size, size);
      
      // PNGとして保存
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(pngPath, buffer);
      
      console.log(`✅ ${pngPath} を作成しました (${size}x${size})`);
      resolve();
    }).catch(reject);
  });
}

// メイン処理
async function main() {
  try {
    const iconsDir = path.join(__dirname, '..', 'public', 'icons');
    
    // 192x192アイコン
    await convertSvgToPng(
      path.join(iconsDir, 'icon-192x192.svg'),
      path.join(iconsDir, 'icon-192x192.png'),
      192
    );
    
    // 512x512アイコン
    await convertSvgToPng(
      path.join(iconsDir, 'icon-512x512.svg'),
      path.join(iconsDir, 'icon-512x512.png'),
      512
    );
    
    console.log('🎉 すべてのアイコン変換が完了しました！');
  } catch (error) {
    console.error('❌ アイコン変換中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
main();
