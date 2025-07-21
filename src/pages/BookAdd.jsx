import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
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
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 8, pb: 8 }}>
      <Typography variant="h5" align="center" gutterBottom data-testid="book-add-title">本を追加</Typography>
      
      <BookScanner 
        onScan={handleScanDetected}
        onScanError={(error) => console.error(error)}
      />
      
      <BookForm isbn={isbn} onBookAdded={handleBookAdded} /> {/* isbnを渡す */}
    </Box>
  );
} 