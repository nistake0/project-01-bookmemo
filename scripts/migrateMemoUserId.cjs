const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, getDocs, updateDoc, doc } = require('firebase/firestore');

// Firebase設定（環境変数から取得）
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * メモにuserIdフィールドを追加するマイグレーション
 */
async function migrateMemoUserId() {
  try {
    console.log('メモのuserIdフィールド追加マイグレーションを開始...');
    
    // すべての本を取得
    const booksSnapshot = await getDocs(collection(db, 'books'));
    console.log(`本の数: ${booksSnapshot.size}`);
    
    let totalMemos = 0;
    let updatedMemos = 0;
    
    for (const bookDoc of booksSnapshot.docs) {
      const bookData = bookDoc.data();
      const bookId = bookDoc.id;
      const userId = bookData.userId;
      
      if (!userId) {
        console.warn(`本 ${bookId} にuserIdがありません。スキップします。`);
        continue;
      }
      
      // 本のメモを取得
      const memosSnapshot = await getDocs(collection(db, 'books', bookId, 'memos'));
      console.log(`本 ${bookId} のメモ数: ${memosSnapshot.size}`);
      
      totalMemos += memosSnapshot.size;
      
      for (const memoDoc of memosSnapshot.docs) {
        const memoData = memoDoc.data();
        const memoId = memoDoc.id;
        
        // userIdフィールドがない場合のみ更新
        if (!memoData.userId) {
          try {
            await updateDoc(doc(db, 'books', bookId, 'memos', memoId), {
              userId: userId
            });
            console.log(`メモ ${memoId} にuserIdを追加: ${userId}`);
            updatedMemos++;
          } catch (error) {
            console.error(`メモ ${memoId} の更新に失敗:`, error);
          }
        } else {
          console.log(`メモ ${memoId} は既にuserIdを持っています: ${memoData.userId}`);
        }
      }
    }
    
    console.log('マイグレーション完了!');
    console.log(`総メモ数: ${totalMemos}`);
    console.log(`更新されたメモ数: ${updatedMemos}`);
    
  } catch (error) {
    console.error('マイグレーション中にエラーが発生:', error);
  }
}

// スクリプト実行
if (require.main === module) {
  migrateMemoUserId();
}

module.exports = { migrateMemoUserId };
