import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert } from '@mui/material';

export const ErrorDialogContext = React.createContext({ setGlobalError: () => {} });

const CommonErrorDialog = ({ open, message, onClose }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>エラーが発生しました</DialogTitle>
    <DialogContent>
      <Alert severity="error" sx={{ mb: 2 }}>
        {message}
      </Alert>
    </DialogContent>
    <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
      <Button onClick={onClose} color="error" variant="contained" autoFocus>
        閉じる
      </Button>
    </DialogActions>
  </Dialog>
);

export const ErrorDialogProvider = ({ children }) => {
  const [error, setError] = useState(null);

  const setGlobalError = (message) => {
    setError(message);
  };

  const handleClose = () => {
    setError(null);
  };

  return (
    <ErrorDialogContext.Provider value={{ setGlobalError }}>
      {children}
      {error && (
        <CommonErrorDialog
          open={!!error}
          message={error}
          onClose={handleClose}
        />
      )}
    </ErrorDialogContext.Provider>
  );
};

export default CommonErrorDialog; 