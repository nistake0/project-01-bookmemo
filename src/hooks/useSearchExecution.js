import { collection, query, where, getDocs, limit, collectionGroup } from 'firebase/firestore';

// 検索クエリの実行とフォールバック処理を担当
// 戻り値: allResults 配列（type: 'book' | 'memo'）
export async function executeSearchQueries({ db, user, queries, resultLimit = 50 }) {
  const allResults = [];

  for (const { type, query: firestoreQuery } of queries) {
    try {
      const querySnapshot = await getDocs(firestoreQuery);

      if (type === 'memo') {
        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          const bookId = doc.ref.parent.parent?.id;

          let bookTitle = 'メモ';
          if (bookId) {
            try {
              const bookDoc = await getDocs(
                query(
                  collection(db, 'books'),
                  where('__name__', '==', bookId),
                  where('userId', '==', user.uid)
                )
              );
              if (!bookDoc.empty) {
                bookTitle = bookDoc.docs[0].data().title || 'メモ';
              }
            } catch (bookError) {
              // 取得失敗時は既定タイトルのまま
            }
          }

          allResults.push({ id: doc.id, type, bookId, bookTitle, ...data });
        }
      } else {
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          allResults.push({ id: doc.id, type, ...data });
        });
      }
    } catch (queryError) {
      // インデックスエラーなどをフォールバック
      const msg = String(queryError?.message || '');
      if (queryError.code === 'failed-precondition' || msg.includes('index') || msg.includes('array-contains-any')) {
        if (type === 'memo') {
          const fallbackQuery = query(
            collectionGroup(db, 'memos'),
            where('userId', '==', user.uid),
            limit(resultLimit * 2)
          );
          const fallbackSnapshot = await getDocs(fallbackQuery);
          for (const doc of fallbackSnapshot.docs) {
            const data = doc.data();
            const bookId = doc.ref.parent.parent?.id;
            let bookTitle = 'メモ';
            if (bookId) {
              try {
                const bookDoc = await getDocs(
                  query(
                    collection(db, 'books'),
                    where('__name__', '==', bookId),
                    where('userId', '==', user.uid)
                  )
                );
                if (!bookDoc.empty) {
                  bookTitle = bookDoc.docs[0].data().title || 'メモ';
                }
              } catch {}
            }
            allResults.push({ id: doc.id, type, bookId, bookTitle, ...data });
          }
        } else {
          const fallbackQuery = query(
            collection(db, 'books'),
            where('userId', '==', user.uid),
            limit(resultLimit * 2)
          );
          const fallbackSnapshot = await getDocs(fallbackQuery);
          fallbackSnapshot.forEach((doc) => {
            const data = doc.data();
            allResults.push({ id: doc.id, type, ...data });
          });
        }
      } else {
        throw queryError;
      }
    }
  }

  return allResults;
}

export default { executeSearchQueries };


