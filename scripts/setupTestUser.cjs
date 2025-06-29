const admin = require('firebase-admin');
const path = require('path');

admin.initializeApp({
  credential: admin.credential.cert(
    require(path.resolve(__dirname, '../serviceAccountKey.json'))
  ),
});

const email = 'testuser@example.com';
const password = 'testpassword';

async function ensureTestUser() {
  try {
    // 既存ユーザーがいれば削除
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().deleteUser(user.uid);
    console.log('既存ユーザーを削除しました');
  } catch (e) {
    // ユーザーがいなければ何もしない
  }
  // 新規作成
  await admin.auth().createUser({ email, password });
  console.log('テストユーザーを作成しました');
  process.exit(0);
}

ensureTestUser(); 