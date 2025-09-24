// src/pages/Confirm.tsx

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";
import styles from '../styles/Form.module.css';
import { FaCheckCircle, FaArrowLeft } from "react-icons/fa";

type BookConfirmationData = {
  id?: number;
  isbn?: string;
  title: string;
  author?: string;
  thumbnail?: string;
  from: 'donate' | 'receive';
};

export default function ConfirmPage() {
  const router = useRouter();
  const [book, setBook] = useState<BookConfirmationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    if (router.isReady && router.query.data) {
      try {
        const decoded = JSON.parse(decodeURIComponent(router.query.data as string));
        setBook(decoded as BookConfirmationData);
        console.log("ConfirmPage でデコードされたデータ:", decoded); 
      } catch (e) {
        console.error("❌ Failed to parse query data:", e);
        setError("確認データの読み込みに失敗しました。");
        setBook(null);
      }
    } else if (router.isReady && !router.query.data) {
      setError("確認するデータが見つかりません。");
    }
  }, [router.isReady, router.query.data]);

  const handleSubmit = async () => {
    if (!book) {
        setError("確認データがありません。");
        return;
    }

    setIsLoading(true);
    setError(''); 
    console.log("Submitting data:", book);

    try {
      if (book.from === "donate") {
        console.log("Calling /api/donate");
        if (!book.title || !book.author) {
             console.error("Donate validation failed: Missing title or author", book);
             let missing = [];
             if (!book.title) missing.push("タイトル");
             if (!book.author) missing.push("著者");
             throw new Error(`登録に必要な情報 (${missing.join(', ')}) が不足しています。`);
        }
        if (!book.isbn || book.isbn.trim() === "") {
             console.error("Donate validation failed: Missing ISBN", book);
             throw new Error("登録にはISBNが必要です。ISBNが見つからない書籍は現在登録できません。前のページで別の書籍を選択するか、ISBNを入力してください。");
        }
        const payload = {
            isbn: book.isbn, 
            title: book.title,
            author: book.author,
            thumbnail: book.thumbnail,
        };
        await axios.post("/api/donate", payload);
        console.log("/api/donate successful");

      } else if (book.from === "receive") {
        if (!book.id) {
             console.error("Receive validation failed: Missing ID", book);
             throw new Error("受け取り処理に必要な本のIDがありません。");
        }
        console.log("Calling /api/receive");
        await axios.post("/api/receive", { id: book.id });
        console.log("/api/receive successful");

      } else {
         throw new Error("不明な操作タイプです。");
      }
      router.push("/done");

    } catch (err: any) {
      console.error("❌ Submit Error:", err);
      const apiErrorMessage = err.response?.data?.error || err.message || "エラーが発生しました";
      setError(`処理に失敗しました: ${apiErrorMessage}`);
    } finally {
        setIsLoading(false);
    }
  };
  if (!router.isReady || (!book && !error)) {
      return <p className={styles.infoMessage}>読み込み中...</p>;
  }
  if (error && !book) {
      return (
          <div className={styles.container}>
              <p className={styles.error}>{error}</p>
              <div className={styles.buttonGroup}>
                  <button type="button" onClick={() => router.back()} className={`${styles.button} ${styles.buttonSecondary}`}>
                      <FaArrowLeft /> 戻る
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.formTitle}>📋 内容の確認</h2>

      {book && (
        <div className={styles.confirmDetails}> 
          {book.thumbnail && (
            <img
              src={book.thumbnail}
              alt={book.title}
              className={styles.thumbnailPreview} 
              style={{marginBottom: '1rem'}} 
            />
          )}
          <p><strong>タイトル:</strong> {book.title}</p>
          {book.author && <p><strong>著者:</strong> {book.author}</p>}
          {book.isbn && <p><strong>ISBN:</strong> {book.isbn}</p>}
          <p><strong>操作:</strong> {book.from === 'donate' ? '寄付する' : '受け取る'}</p>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.buttonGroup}>
        <button
          type="button"
          onClick={() => router.back()} 
          className={`${styles.button} ${styles.buttonSecondary}`}
          disabled={isLoading}
        >
           <FaArrowLeft /> 戻る
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className={`${styles.button} ${styles.buttonPrimary}`}
          disabled={isLoading || !book}
        >
          {isLoading ? '処理中...' : <><FaCheckCircle /> 確定する</>}
        </button>
      </div>
    </div>
  );
}