import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import BookForm from "../components/BookForm";
import BookScanner from "../components/BookScanner";

export default function BookAdd() {
  const navigate = useNavigate();

  const handleScanDetected = (code) => {
    // BookFormにISBNを渡すための処理
    // この実装は後でBookFormとの連携を調整
  };

  const handleBookAdded = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  return (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 8, pb: 8 }}>
      <Typography variant="h5" align="center" gutterBottom>本を追加</Typography>
      
      <BookScanner 
        onScanDetected={handleScanDetected}
        onScanError={(error) => console.error(error)}
      />
      
      <BookForm onBookAdded={handleBookAdded} />
    </Box>
  );
} 