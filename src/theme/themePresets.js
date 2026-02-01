/**
 * テーマプリセット定義
 * doc/theme-selectable-review-20260131.md に基づく
 *
 * @param {Function} buildPath - パス構築関数 (path) => string
 */

export const THEME_PRESET_IDS = ['library-classic', 'minimal-light', 'slim-compact'];

export function getThemePresets(buildPath) {
  const bp = (path) => `url("${buildPath(path)}")`;

  return {
    'library-classic': {
      id: 'library-classic',
      name: '図書館（クラシック）',
      description: '図書館をイメージした背景と茶系の落ち着いたデザイン',
      background: {
        image: bp('/library-background.jpg'),
        pattern: bp('/library-pattern.svg'),
      },
      overlay: {
        top: 'rgba(245, 247, 250, 0.3)',
        mid: 'rgba(139, 69, 19, 0.1)',
        bottom: 'rgba(15, 23, 42, 0.2)',
      },
      backgroundColor: '#eef2ff',
      bookAccent: 'brown',
      memoAccent: 'memo',
      cardAccent: 'brown',
      bookDecorations: { corners: true, innerBorder: true, centerLine: true },
      memoDecorations: {
        corners: false,
        innerBorder: false,
        centerLine: false,
        borderRadius: 0,
        foldedCorner: true,
        foldedCornerPosition: 'top-right',
      },
      cardDecorations: { corners: true, innerBorder: true, centerLine: true },
      glassEffect: { opacity: 0.75, blur: '20px', saturate: '180%' },
      pageHeader: {
        backgroundImage: 'paper',
        goldOverlay: true,
        centerLine: true,
        borderRadius: { xs: 16, sm: 20 },
        accentKey: 'brown',
        titleFontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
        subtitleFontSize: { xs: '0.9rem', sm: '1rem' },
      },
      cardShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
      cardShadowHover: '0 12px 40px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
      chartColors: { bar: '#42a5f5', memo: '#9c27b0' },
      motion: {
        infoCardHover: { transition: 'transform 0.2s ease-in-out', hoverTransform: 'translateY(-2px)' },
      },
      typographyOverrides: {
        cardTitle: { fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' } },
        cardSubtext: { fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.9rem' } },
        cardCaption: { fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' } },
        chipLabel: { fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' }, height: { xs: 18, sm: 20, md: 22 } },
        formText: { fontSize: { xs: '0.8rem', sm: '0.9rem' } },
        chipSmall: { fontSize: '0.75rem' },
        formChip: { fontSize: { xs: '0.75rem', sm: '0.8rem' }, height: { xs: 24, sm: 28 } },
      },
      sizes: {
        bookCoverCard: { width: { xs: 50, sm: 60 }, height: { xs: 70, sm: 80 } },
        bookCoverDetail: { maxHeight: 250, width: 167 },
        bookCoverFormPreview: { maxHeight: 120 },
        bookCoverDialogPreview: { maxHeight: 180 },
        bookCard: { minHeight: { xs: 140, sm: 160 }, tagAreaMinHeight: { xs: 32, sm: 36 } },
        memoCard: {
          textArea: { minHeight: 48, maxHeight: 80 },
          actionArea: { minHeight: { xs: 48, sm: 64 }, maxHeight: { xs: 72, sm: 88 } },
        },
        formButton: { height: { xs: 40, sm: 56 } },
      },
      spacing: {
        cardPadding: { xs: 1.5, sm: 2 },
      },
    },
    'minimal-light': {
      id: 'minimal-light',
      name: 'ミニマル（ライト）',
      description: 'シンプルな単色背景で読みやすさを重視',
      background: {
        image: 'none',
        pattern: 'none',
      },
      overlay: {
        top: 'transparent',
        mid: 'transparent',
        bottom: 'transparent',
      },
      backgroundColor: '#f5f5f5',
      bookAccent: 'neutral',
      memoAccent: 'neutral',
      cardAccent: 'neutral',
      bookDecorations: { corners: false, innerBorder: false, centerLine: false },
      memoDecorations: { corners: false, innerBorder: false, centerLine: false },
      cardDecorations: { corners: false, innerBorder: false, centerLine: false },
      glassEffect: { opacity: 0.9, blur: '12px', saturate: '140%' },
      pageHeader: {
        backgroundImage: 'none',
        goldOverlay: false,
        centerLine: false,
        borderRadius: 0,
        accentKey: 'neutral',
        titleFontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
        subtitleFontSize: { xs: '0.9rem', sm: '1rem' },
      },
      cardShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
      cardShadowHover: '0 12px 40px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
      chartColors: { bar: '#42a5f5', memo: '#9c27b0' },
      motion: {
        infoCardHover: { transition: 'transform 0.2s ease-in-out', hoverTransform: 'translateY(-2px)' },
      },
      typographyOverrides: {
        cardTitle: { fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' } },
        cardSubtext: { fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.9rem' } },
        cardCaption: { fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' } },
        chipLabel: { fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' }, height: { xs: 18, sm: 20, md: 22 } },
        formText: { fontSize: { xs: '0.8rem', sm: '0.9rem' } },
        chipSmall: { fontSize: '0.75rem' },
        formChip: { fontSize: { xs: '0.75rem', sm: '0.8rem' }, height: { xs: 24, sm: 28 } },
      },
      sizes: {
        bookCoverCard: { width: { xs: 50, sm: 60 }, height: { xs: 70, sm: 80 } },
        bookCoverDetail: { maxHeight: 250, width: 167 },
        bookCoverFormPreview: { maxHeight: 120 },
        bookCoverDialogPreview: { maxHeight: 180 },
        bookCard: { minHeight: { xs: 140, sm: 160 }, tagAreaMinHeight: { xs: 32, sm: 36 } },
        memoCard: {
          textArea: { minHeight: 48, maxHeight: 80 },
          actionArea: { minHeight: { xs: 48, sm: 64 }, maxHeight: { xs: 72, sm: 88 } },
        },
        formButton: { height: { xs: 40, sm: 56 } },
      },
      spacing: {
        cardPadding: { xs: 1.5, sm: 2 },
      },
    },
    'slim-compact': {
      id: 'slim-compact',
      name: 'スリム（コンパクト）',
      description: 'フォント・余白を抑え、一覧性を重視。多くの情報を画面に表示',
      typographyScale: 0.88,
      background: {
        image: 'none',
        pattern: 'none',
      },
      overlay: {
        top: 'transparent',
        mid: 'transparent',
        bottom: 'transparent',
      },
      backgroundColor: '#f5f5f5',
      bookAccent: 'neutral',
      memoAccent: 'neutral',
      cardAccent: 'neutral',
      bookDecorations: { corners: false, innerBorder: false, centerLine: false },
      memoDecorations: { corners: false, innerBorder: false, centerLine: false },
      cardDecorations: { corners: false, innerBorder: false, centerLine: false },
      glassEffect: { opacity: 0.92, blur: '10px', saturate: '130%' },
      pageHeader: {
        backgroundImage: 'none',
        goldOverlay: false,
        centerLine: false,
        borderRadius: 0,
        accentKey: 'neutral',
        titleFontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' },
        subtitleFontSize: { xs: '0.75rem', sm: '0.85rem' },
      },
      cardShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
      cardShadowHover: '0 12px 40px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
      chartColors: { bar: '#42a5f5', memo: '#9c27b0' },
      motion: {
        infoCardHover: { transition: 'transform 0.2s ease-in-out', hoverTransform: 'translateY(-2px)' },
      },
      typographyOverrides: {
        cardTitle: { fontSize: { xs: '0.8rem', sm: '0.88rem', md: '0.95rem' } },
        cardSubtext: { fontSize: { xs: '0.68rem', sm: '0.72rem', md: '0.8rem' } },
        cardCaption: { fontSize: { xs: '0.62rem', sm: '0.66rem', md: '0.72rem' } },
        chipLabel: { fontSize: { xs: '0.58rem', sm: '0.62rem', md: '0.66rem' }, height: { xs: 16, sm: 18, md: 20 } },
        formText: { fontSize: { xs: '0.72rem', sm: '0.8rem' } },
        chipSmall: { fontSize: '0.66rem' },
        formChip: { fontSize: { xs: '0.66rem', sm: '0.72rem' }, height: { xs: 20, sm: 24 } },
      },
      sizes: {
        bookCoverCard: { width: { xs: 44, sm: 52 }, height: { xs: 62, sm: 70 } },
        bookCoverDetail: { maxHeight: 200, width: 140 },
        bookCoverFormPreview: { maxHeight: 100 },
        bookCoverDialogPreview: { maxHeight: 150 },
        bookCard: { minHeight: { xs: 120, sm: 135 }, tagAreaMinHeight: { xs: 26, sm: 30 } },
        memoCard: {
          textArea: { minHeight: 40, maxHeight: 68 },
          actionArea: { minHeight: { xs: 40, sm: 54 }, maxHeight: { xs: 60, sm: 76 } },
        },
        formButton: { height: { xs: 34, sm: 46 } },
      },
      spacing: {
        cardPadding: { xs: 1, sm: 1.5 },
      },
      layout: {
        bookListGrid: {
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' },
          gap: { xs: 1, sm: 1.5 },
        },
        searchResultsGrid: {
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 1.5,
        },
        statsSummaryGrid: {
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: { xs: 0.75, sm: 1.5 },
        },
        statsChartGrid: {
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 1.5,
        },
        statsTagGrid: {
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
          gap: { xs: 1, sm: 1.5 },
        },
        tagStatsSummaryGrid: {
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1.5,
        },
        tagStatsGrid: {
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
          gap: { xs: 1, sm: 1.5 },
        },
        dateRangeGrid: {
          gridTemplateColumns: '1fr 1fr',
          gap: 1.5,
        },
      },
    },
  };
}
