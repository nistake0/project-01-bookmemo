import { Typography, Box, Button, Tabs, Tab, TextField, IconButton, Tooltip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { GetApp as InstallIcon } from '@mui/icons-material';
import BookCard from "../components/BookCard";
import PageHeader from "../components/common/PageHeader";
import { useBookList } from "../hooks/useBookList";
import { usePWA } from "../hooks/usePWA";
import { FILTER_STATUSES, FILTER_LABELS } from "../constants/bookStatus";

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
      pb: { xs: "72px", sm: "80px" }
    }}>
      {/* 統一されたヘッダー */}
      <PageHeader 
        title="本一覧"
        subtitle="あなたの読書ライブラリ"
        data-testid="book-list-header"
      />
      
      {/* メインコンテンツ */}
      <Box sx={{ px: { xs: 1.5, sm: 2, md: 0 } }}>
        {/* PWAインストールボタン */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: 1,
          flexWrap: 'wrap',
          mb: 2
        }}>
          {isInstallable && !isInstalled && (
            <Tooltip title="BookMemoをアプリとしてインストール">
              <IconButton
                color="primary"
                onClick={handleInstallClick}
                sx={{ 
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
                color="secondary"
                onClick={handleManualInstallGuide}
                sx={{ 
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

        {/* 本を追加ボタン */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mb: 3 
        }}>
          <Button 
            variant="contained" 
            data-testid="book-add-button" 
            onClick={() => navigate("/add")}
            sx={{ 
              fontSize: { xs: '0.9rem', sm: '1rem' },
              py: { xs: 1, sm: 1.5 },
              px: { xs: 2, sm: 3 }
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
            variant={{ xs: "scrollable", sm: "standard" }}
            scrollButtons="auto"
            allowScrollButtonsMobile
            centered={{ sm: true }}
            sx={{
              '& .MuiTab-root': {
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                minHeight: { xs: '40px', sm: '48px' },
                minWidth: { xs: '60px', sm: 'auto' },
                px: { xs: 1, sm: 2 }
              },
              '& .MuiTabs-scrollButtons': {
                '&.Mui-disabled': {
                  opacity: 0.3
                }
              }
            }}
          >
            <Tab label={FILTER_LABELS[FILTER_STATUSES.ALL]} value={FILTER_STATUSES.ALL} />
            <Tab label={FILTER_LABELS[FILTER_STATUSES.TSUNDOKU]} value={FILTER_STATUSES.TSUNDOKU} />
            <Tab label={FILTER_LABELS[FILTER_STATUSES.READING]} value={FILTER_STATUSES.READING} />
            <Tab label={FILTER_LABELS[FILTER_STATUSES.RE_READING]} value={FILTER_STATUSES.RE_READING} />
            <Tab label={FILTER_LABELS[FILTER_STATUSES.FINISHED]} value={FILTER_STATUSES.FINISHED} />
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
          <Box 
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)'
              },
              gap: { xs: 1.5, sm: 2 },
              dataTestid: 'book-list-grid'
            }}
            data-testid="book-list-grid"
          >
            {filteredBooks.map(book => (
              <Box 
                key={book.id} 
                data-testid={`book-grid-item-${book.id}`}
              >
                <BookCard 
                  book={book}
                  onClick={() => handleBookClick(book.id)}
                  testId={`book-list-card-${book.id}`}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
} 