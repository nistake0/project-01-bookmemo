import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f5f7fa', // 明るいグレー
      paper: '#fff'
    },
    primary: {
      main: '#1976d2' // 青系
    },
    secondary: {
      main: '#f50057' // ピンク系
    },
    text: {
      primary: '#222'
    }
  },
  typography: {
    fontFamily: 'Segoe UI, Helvetica Neue, Arial, sans-serif',
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </StrictMode>
)
