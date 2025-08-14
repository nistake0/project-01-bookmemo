import { useCallback, useContext, useState } from 'react';
import { collection, collectionGroup, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { ErrorDialogContext } from '../components/CommonErrorDialog';

function normalizeTag(tag) {
  if (tag == null) return '';
  return String(tag).trim();
}

export default function useTagManagement() {
  const { user } = useAuth();
  const errorContext = useContext(ErrorDialogContext);
  const setGlobalError = errorContext?.setGlobalError || (() => {});
  const [loading, setLoading] = useState(false);

  const processInBatches = async (documents, updater) => {
    const BATCH_LIMIT = 450; // safety margin under 500
    for (let i = 0; i < documents.length; i += BATCH_LIMIT) {
      const slice = documents.slice(i, i + BATCH_LIMIT);
      const batch = writeBatch(db);
      slice.forEach((d) => updater(batch, d));
      await batch.commit();
    }
  };

  const renameTag = useCallback(async (oldTagInput, newTagInput) => {
    if (!user?.uid) throw new Error('ユーザーが未認証です。');
    const oldTag = normalizeTag(oldTagInput);
    const newTag = normalizeTag(newTagInput);
    if (!oldTag || !newTag) throw new Error('タグ名が不正です。');
    if (oldTag === newTag) return { booksUpdated: 0, memosUpdated: 0 };

    setLoading(true);
    try {
      // Books for user
      const booksQ = query(collection(db, 'books'), where('userId', '==', user.uid));
      const booksSnap = await getDocs(booksQ);
      const booksToUpdate = [];
      booksSnap.forEach((d) => {
        const data = d.data();
        const tags = Array.isArray(data.tags) ? data.tags : [];
        if (tags.includes(oldTag)) {
          const replaced = Array.from(new Set(tags.map((t) => (t === oldTag ? newTag : t))));
          booksToUpdate.push({ ref: d.ref, tags: replaced });
        }
      });

      // Memos (collection group)
      const memosQ = query(collectionGroup(db, 'memos'), where('userId', '==', user.uid));
      const memosSnap = await getDocs(memosQ);
      const memosToUpdate = [];
      memosSnap.forEach((d) => {
        const data = d.data();
        const tags = Array.isArray(data.tags) ? data.tags : [];
        if (tags.includes(oldTag)) {
          const replaced = Array.from(new Set(tags.map((t) => (t === oldTag ? newTag : t))));
          memosToUpdate.push({ ref: d.ref, tags: replaced });
        }
      });

      await processInBatches(booksToUpdate, (batch, item) => {
        batch.update(item.ref, { tags: item.tags });
      });
      await processInBatches(memosToUpdate, (batch, item) => {
        batch.update(item.ref, { tags: item.tags });
      });

      return { booksUpdated: booksToUpdate.length, memosUpdated: memosToUpdate.length };
    } catch (e) {
      console.error('タグ名変更に失敗:', e);
      setGlobalError('タグ名の変更に失敗しました。');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const deleteTag = useCallback(async (tagInput) => {
    if (!user?.uid) throw new Error('ユーザーが未認証です。');
    const tag = normalizeTag(tagInput);
    if (!tag) throw new Error('タグ名が不正です。');

    setLoading(true);
    try {
      const booksQ = query(collection(db, 'books'), where('userId', '==', user.uid));
      const booksSnap = await getDocs(booksQ);
      const booksToUpdate = [];
      booksSnap.forEach((d) => {
        const data = d.data();
        const tags = Array.isArray(data.tags) ? data.tags : [];
        if (tags.includes(tag)) {
          const filtered = tags.filter((t) => t !== tag);
          booksToUpdate.push({ ref: d.ref, tags: filtered });
        }
      });

      const memosQ = query(collectionGroup(db, 'memos'), where('userId', '==', user.uid));
      const memosSnap = await getDocs(memosQ);
      const memosToUpdate = [];
      memosSnap.forEach((d) => {
        const data = d.data();
        const tags = Array.isArray(data.tags) ? data.tags : [];
        if (tags.includes(tag)) {
          const filtered = tags.filter((t) => t !== tag);
          memosToUpdate.push({ ref: d.ref, tags: filtered });
        }
      });

      await processInBatches(booksToUpdate, (batch, item) => {
        batch.update(item.ref, { tags: item.tags });
      });
      await processInBatches(memosToUpdate, (batch, item) => {
        batch.update(item.ref, { tags: item.tags });
      });

      return { booksUpdated: booksToUpdate.length, memosUpdated: memosToUpdate.length };
    } catch (e) {
      console.error('タグ削除に失敗:', e);
      setGlobalError('タグの削除に失敗しました。');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const mergeTags = useCallback(async (aliasesInput, canonicalInput) => {
    if (!user?.uid) throw new Error('ユーザーが未認証です。');
    const canonical = normalizeTag(canonicalInput);
    const aliases = Array.from(new Set(String(aliasesInput || '')
      .split(',')
      .map((s) => normalizeTag(s))
      .filter((s) => !!s)));
    if (!canonical || aliases.length === 0) throw new Error('統合先と別名を入力してください。');
    if (aliases.includes(canonical)) {
      throw new Error('統合先と別名が同一です。');
    }

    setLoading(true);
    try {
      // Books
      const booksQ = query(collection(db, 'books'), where('userId', '==', user.uid));
      const booksSnap = await getDocs(booksQ);
      const booksToUpdate = [];
      booksSnap.forEach((d) => {
        const data = d.data();
        const tags = Array.isArray(data.tags) ? data.tags : [];
        const hasAlias = tags.some((t) => aliases.includes(t));
        if (hasAlias) {
          const kept = tags.filter((t) => !aliases.includes(t));
          const merged = Array.from(new Set([...kept, canonical]));
          if (merged.join('|') !== tags.join('|')) {
            booksToUpdate.push({ ref: d.ref, tags: merged });
          }
        }
      });

      // Memos
      const memosQ = query(collectionGroup(db, 'memos'), where('userId', '==', user.uid));
      const memosSnap = await getDocs(memosQ);
      const memosToUpdate = [];
      memosSnap.forEach((d) => {
        const data = d.data();
        const tags = Array.isArray(data.tags) ? data.tags : [];
        const hasAlias = tags.some((t) => aliases.includes(t));
        if (hasAlias) {
          const kept = tags.filter((t) => !aliases.includes(t));
          const merged = Array.from(new Set([...kept, canonical]));
          if (merged.join('|') !== tags.join('|')) {
            memosToUpdate.push({ ref: d.ref, tags: merged });
          }
        }
      });

      await processInBatches(booksToUpdate, (batch, item) => {
        batch.update(item.ref, { tags: item.tags });
      });
      await processInBatches(memosToUpdate, (batch, item) => {
        batch.update(item.ref, { tags: item.tags });
      });

      return { booksUpdated: booksToUpdate.length, memosUpdated: memosToUpdate.length };
    } catch (e) {
      console.error('タグ統合に失敗:', e);
      setGlobalError('タグの統合に失敗しました。');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  return {
    loading,
    renameTag,
    deleteTag,
    mergeTags,
  };
}


