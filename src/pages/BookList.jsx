import { Typography, Box, Button, Tabs, Tab, TextField, Grid, IconButton, Tooltip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { GetApp as InstallIcon } from '@mui/icons-material';
import BookCard from "../components/BookCard";
import { useBookList } from "../hooks/useBookList";
import { usePWA } from "../hooks/usePWA";

export default function BookList() {
  const navigate = useNavigate();
  const { isInstallable, isInstalled, installApp, shouldShowManualInstallGuide } = usePWA();
  const {
    filteredBooks,
    loading,
    error,
    filter,
    searchText,
    handleFilterChange,
    handleSearchChange,
  } = useBookList();

  const handleBookClick = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  const handleInstallClick = async () => {
    try {
      await installApp();
    } catch (error) {
      console.error('Installation failed:', error);
    }
  };

  const handleManualInstallGuide = () => {
    // iPhone用の手動インストールガイドを表示
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (isIOS && isSafari) {
      alert(`📱 BookMemoをホーム画面に追加する手順：

1. 共有ボタンをタップ
   Safariの下部にある「共有」ボタン（□↑）をタップ

2. 「ホーム画面に追加」を選択
   共有メニューから「ホーム画面に追加」を選択

3. 追加を確認
   「追加」をタップしてホーム画面に追加

これでBookMemoをアプリとして使用できます！`);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Box sx={{ 
      maxWidth: 1200, 
      mx: "auto", 
      mt: { xs: 1, sm: 2, md: 4 }, 
      pb: { xs: "72px", sm: "80px" },
      px: { xs: 1.5, sm: 2, md: 0 }
    }}>
      {/* ヘッダーエリア */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: { xs: 1.5, sm: 2 },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1.5, sm: 0 }
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          width: { xs: '100%', sm: 'auto' }
        }}>
          <Typography 
            variant="h4" 
            gutterBottom 
            data-testid="book-list-title"
            sx={{ 
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
              fontWeight: 600,
              mb: 0
            }}
          >
            本一覧
          </Typography>
          {/* PWAインストールボタン */}
          {isInstallable && !isInstalled && (
            <Tooltip title="BookMemoをアプリとしてインストール">
              <IconButton
                color="primary"
                onClick={handleInstallClick}
                sx={{ 
                  ml: 1,
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  }
                }}
                data-testid="pwa-install-header-button"
              >
                <InstallIcon />
              </IconButton>
            </Tooltip>
          )}
          {/* iPhone用の手動インストールガイドボタン */}
          {shouldShowManualInstallGuide && !isInstalled && (
            <Tooltip title="iPhoneでホーム画面に追加する手順を表示">
              <IconButton
                color="primary"
                onClick={handleManualInstallGuide}
                sx={{ 
                  ml: 1,
                  backgroundColor: 'secondary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'secondary.dark',
                  }
                }}
                data-testid="pwa-manual-install-button"
              >
                <InstallIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Button 
          variant="contained" 
          data-testid="book-add-button" 
          onClick={() => navigate("/add")}
          sx={{ 
            width: { xs: '100%', sm: 'auto' },
            fontSize: { xs: '0.9rem', sm: '1rem' },
            py: { xs: 1, sm: 1.5 }
          }}
        >
          本を追加
        </Button>
      </Box>

      {/* 検索フィールド */}
      <TextField
        label="検索（タイトル・著者・タグ）"
        value={searchText}
        onChange={handleSearchChange}
        fullWidth
        size="small"
        sx={{ 
          mb: { xs: 1.5, sm: 2 },
          '& .MuiOutlinedInput-root': {
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }
        }}
      />

      {/* タブナビゲーション */}
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider', 
        mb: { xs: 1.5, sm: 2 },
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        backgroundColor: 'background.paper'
      }} data-testid="book-list-tabs-container" style={{ position: 'sticky', top: 0, zIndex: 1100 }}>
        <Tabs 
          value={filter} 
          onChange={handleFilterChange} 
          centered
          sx={{
            '& .MuiTab-root': {
              fontSize: { xs: '0.8rem', sm: '0.9rem' },
              minHeight: { xs: '40px', sm: '48px' }
            }
          }}
        >
          <Tab label="すべて" value="all" />
          <Tab label="読書中" value="reading" />
          <Tab label="読了" value="finished" />
        </Tabs>
      </Box>

      {/* 書籍一覧 */}
      {filteredBooks.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: { xs: 3, sm: 4 },
          px: { xs: 2, sm: 0 }
        }}>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          >
            該当する本がありません
          </Typography>
        </Box>
      ) : (
        <Grid 
          container 
          spacing={{ xs: 1.5, sm: 2 }} 
          data-testid="book-list-grid"
        >
          {filteredBooks.map(book => (
            <Grid 
              key={book.id} 
              item
              xs={12} 
              sm={6} 
              md={4} 
              lg={3}
              data-testid={`book-grid-item-${book.id}`}
            >
              <BookCard 
                book={book}
                onClick={() => handleBookClick(book.id)}
                testId={`book-list-card-${book.id}`}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
} 