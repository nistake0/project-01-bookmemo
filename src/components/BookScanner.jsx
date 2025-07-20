import React, { useState, useContext } from "react";
import { Button, Box, Typography, Modal, IconButton } from "@mui/material";
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import BarcodeScanner from "./BarcodeScanner";
import { ErrorDialogContext } from './CommonErrorDialog';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const BookScanner = ({ onScanDetected, onScanError }) => {
  const [isScannerOpen, setScannerOpen] = useState(false);
  const { setGlobalError } = useContext(ErrorDialogContext) || { setGlobalError: () => {} };

  const handleScanDetected = (code) => {
    onScanDetected(code);
    setScannerOpen(false);
  };
  
  const handleScanError = (errorMessage) => {
    setGlobalError(errorMessage);
    setScannerOpen(false);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<CameraAltIcon />}
        onClick={() => setScannerOpen(true)}
        sx={{ mt: 2, mb: 2 }}
        fullWidth
      >
        バーコードスキャン
      </Button>

      <Modal
        open={isScannerOpen}
        onClose={() => setScannerOpen(false)}
        aria-labelledby="scanner-modal-title"
      >
        <Box sx={modalStyle}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography id="scanner-modal-title" variant="h6" component="h2">
              バーコードスキャン
            </Typography>
            <IconButton onClick={() => setScannerOpen(false)}>
              <Typography variant="h6">×</Typography>
            </IconButton>
          </Box>
          <BarcodeScanner
            onDetected={handleScanDetected}
            onError={handleScanError}
          />
        </Box>
      </Modal>
    </>
  );
};

export default BookScanner; 