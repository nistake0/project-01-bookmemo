import { useState, useCallback, useContext } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { ErrorDialogContext } from '../components/CommonErrorDialog';
import axios from 'axios';

export const useBookSearch = () => {
  const { user } = useAuth();
  const errorContext = useContext(ErrorDialogContext);
  const setGlobalError = errorContext?.setGlobalError || (() => {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);

  const searchBookByIsbn = useCallback(async (isbn) => {
    if (!isbn || !isbn.trim()) {
      setError("ISBNを入力してください");
      return null;
    }

    setError("");
    setLoading(true);
    setSearchPerformed(true);

    try {
      const targetIsbn = isbn.trim();
      
      // OpenBD APIで書籍情報を取得
      const openbdResponse = await axios.get(`https://api.openbd.jp/v1/get?isbn=${targetIsbn}`);
      const bookData = openbdResponse.data[0];
      
      let title = "";
      let author = "";
      let publisher = "";
      let publishedDate = "";
      let coverUrl = "";
      let tags = [];

      // OpenBDで書籍情報が見つかった場合
      if (bookData && bookData.summary) {
        title = bookData.summary.title || "";
        author = bookData.summary.author || "";
        publisher = bookData.summary.publisher || "";
        publishedDate = bookData.summary.pubdate || "";
        coverUrl = bookData.summary.cover || "";

        // OpenBDのタグ情報を追加
        if (bookData.summary.subject) tags.push(bookData.summary.subject);
        if (bookData.summary.ndc) tags.push(bookData.summary.ndc);
      }

      // カバー画像が無い場合、またはOpenBDで書籍情報が見つからない場合はGoogle Books APIを呼ぶ
      if (!coverUrl || !title) {
        try {
          const googleResponse = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${targetIsbn}`);
          const googleBookData = googleResponse.data;
          
          if (googleBookData.items && googleBookData.items.length > 0) {
            const volumeInfo = googleBookData.items[0].volumeInfo;
            
            // OpenBDで取得できなかった情報をGoogle Booksから補完
            if (!title) title = volumeInfo.title || "";
            if (!author) author = volumeInfo.authors ? volumeInfo.authors.join(", ") : "";
            if (!publisher) publisher = volumeInfo.publisher || "";
            if (!publishedDate) publishedDate = volumeInfo.publishedDate || "";
            
            // カバー画像
            if (!coverUrl && volumeInfo.imageLinks) {
              coverUrl = volumeInfo.imageLinks.thumbnail || volumeInfo.imageLinks.smallThumbnail || "";
            }
            
            // Google Booksのカテゴリをタグに追加
            if (volumeInfo.categories && volumeInfo.categories.length > 0) {
              tags = [...tags, ...volumeInfo.categories];
            }
          }
        } catch (googleErr) {
          console.error("Failed to fetch from Google Books API", googleErr);
        }
      }

      // 最終的に書籍情報が取得できたかチェック
      if (title) {
        const result = {
          isbn: targetIsbn,
          title,
          author,
          publisher,
          publishedDate,
          coverImageUrl: coverUrl,
          tags: Array.from(new Set(tags)), // 重複除去
        };
        return result;
      } else {
        setGlobalError("書籍情報が見つかりませんでした");
        return null;
      }
    } catch (err) {
      const errorMessage = "書籍情報の取得に失敗しました";
      setGlobalError(errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setGlobalError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchPerformed(false);
    setError(null);
  }, []);

  return {
    searchBookByIsbn,
    loading,
    error,
    searchPerformed,
    clearError,
    clearSearch,
  };
};
