const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.resolve(__dirname, '../serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// テスト用ユーザーUID（testuser@example.com）
const TEST_USER_ID = 'gHuB3zzi7NUojTZxI4asWyd8tNU2'; // ← testuser@example.com のUID

async function deleteCollection(collectionRef) {
  const snapshot = await collectionRef.get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}

async function deleteBooksAndMemos() {
  const booksRef = db.collection('books');
  const booksSnapshot = await booksRef.where('userId', '==', TEST_USER_ID).get();

  console.log('Found books:', booksSnapshot.size);
  for (const bookDoc of booksSnapshot.docs) {
    console.log('Deleting book:', bookDoc.id, bookDoc.data().userId);
    // memosサブコレクションを全削除
    const memosRef = bookDoc.ref.collection('memos');
    await deleteCollection(memosRef);
    // 本自体を削除
    await bookDoc.ref.delete();
  }
  console.log('Test user books and memos deleted');
}

deleteBooksAndMemos().then(() => process.exit(0)); 