import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import PageHeader from "../components/common/PageHeader";
import BookForm from "../components/BookForm";
import BookScanner from "../components/BookScanner";

export default function BookAdd() {
  const [isbn, setIsbn] = useState(""); // 追加
  const navigate = useNavigate();

  const handleScanDetected = (code) => {
    console.log("[BookAdd] handleScanDetected スキャン結果:", code);
    setIsbn(code); // スキャン結果を状態にセット
  };

  const handleBookAdded = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  return (
    <Box sx={{ 
      maxWidth: 500, 
      mx: "auto", 
      pb: { xs: "72px", sm: "80px" }
    }}>
      {/* 統一されたヘッダー */}
      <PageHeader 
        title="本を追加"
        subtitle="新しい本をライブラリに追加"
      />
      
      {/* メインコンテンツ */}
      <Box sx={{ px: { xs: 1.5, sm: 2, md: 0 } }}>
        <BookScanner 
          onScan={handleScanDetected}
          onScanError={(error) => console.error(error)}
        />
        
        <BookForm isbn={isbn} onBookAdded={handleBookAdded} />
      </Box>
    </Box>
  );
} 