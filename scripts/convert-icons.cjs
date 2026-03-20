const fs = require('fs');
const path = require('path');

// 画像をリサイズして保存する関数（icon-source.png 用）
function resizeImage(sourcePath, pngPath, size) {
  return new Promise((resolve, reject) => {
    const { createCanvas, loadImage } = require('canvas');
    loadImage(sourcePath).then((img) => {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, size, size);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(pngPath, buffer);
      console.log(`✅ ${path.basename(pngPath)} を作成しました (${size}x${size})`);
      resolve();
    }).catch(reject);
  });
}

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
    const sourcePath = path.join(iconsDir, 'icon-source.png');
    const useSourceImage = fs.existsSync(sourcePath);

    if (useSourceImage) {
      // icon-source.png から各サイズを生成
      console.log('📷 icon-source.png からアイコンを生成します...');
      await resizeImage(sourcePath, path.join(iconsDir, 'icon-192x192.png'), 192);
      await resizeImage(sourcePath, path.join(iconsDir, 'icon-512x512.png'), 512);
      await resizeImage(sourcePath, path.join(iconsDir, 'apple-touch-icon.png'), 180);
      fs.copyFileSync(
        path.join(iconsDir, 'icon-512x512.png'),
        path.join(iconsDir, 'apple-touch-icon-512x512.png')
      );
      console.log('✅ apple-touch-icon-512x512.png を作成しました (512x512)');
    } else {
      // SVGから生成（従来の方法）
      await convertSvgToPng(
        path.join(iconsDir, 'icon-192x192.svg'),
        path.join(iconsDir, 'icon-192x192.png'),
        192
      );
      await convertSvgToPng(
        path.join(iconsDir, 'icon-512x512.svg'),
        path.join(iconsDir, 'icon-512x512.png'),
        512
      );
      await convertSvgToPng(
        path.join(iconsDir, 'icon-512x512.svg'),
        path.join(iconsDir, 'apple-touch-icon.png'),
        180
      );
      fs.copyFileSync(
        path.join(iconsDir, 'icon-512x512.png'),
        path.join(iconsDir, 'apple-touch-icon-512x512.png')
      );
      console.log('✅ apple-touch-icon-512x512.png を作成しました (512x512)');
    }

    console.log('🎉 すべてのアイコン変換が完了しました！');
  } catch (error) {
    console.error('❌ アイコン変換中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
main();
