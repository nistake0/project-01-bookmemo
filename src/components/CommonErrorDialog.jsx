import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

export const ErrorDialogContext = React.createContext({ setGlobalError: () => {} });

const CommonErrorDialog = ({ open, message, onClose }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>エラー</DialogTitle>
    <DialogContent>
      {message}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="primary" autoFocus>
        閉じる
      </Button>
    </DialogActions>
  </Dialog>
);

export default CommonErrorDialog; 