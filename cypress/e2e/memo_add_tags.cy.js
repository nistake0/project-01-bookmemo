describe('メモ入力時のタグ欄デフォルト設定テスト', () => {
  beforeEach(() => {
    // ログアウト処理（明示的に認証状態をリセット）
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // ログイン処理
    cy.visit('/login');
    cy.get('[data-testid="login-email-input"]').type('testuser@example.com');
    cy.get('[data-testid="login-password-input"]').type('testpassword');
    cy.get('[data-testid="login-submit"]').click();
    cy.get('[data-testid="page-header-title"]').should('contain', '本一覧');
    
    // テスト用の本を追加（タグ付き）
    cy.get('[data-testid="book-add-button"]').click();

    // デバッグ: 遷移後のURLを確認
    cy.url().then((url) => {
      cy.log('URL after clicking book-add-button:', url);
    });

    // URLが/addに遷移したことを確認
    cy.url().should('include', '/add');

    // デバッグ: ページの内容を確認
    cy.get('body').then(($body) => {
      cy.log('Page content:', $body.text());
    });

    // デバッグ: スクリーンショットを取得
    cy.screenshot('after-navigation');

    // 「本を追加」画面のタイトルを確認（PageHeaderのタイトルを確認）
    cy.get('[data-testid="page-header-title"]').should('contain', '本を追加');

    // BookFormが表示されるまで待機
    cy.get('[data-testid="book-form"]', { timeout: 15000 }).should('exist');
    
    cy.get('[data-testid="book-isbn-input"]').type('9781234567890');
    cy.get('[data-testid="book-title-input"]').type('タグ付きテスト本');
    cy.get('[data-testid="book-author-input"]').type('テスト著者');
    cy.get('[data-testid="book-publisher-input"]').type('テスト出版社');
    cy.get('[data-testid="book-publishdate-input"]').type('2024-07-01');
    
    // 本にタグを追加
    cy.get('[data-testid="book-tags-input"]').type('小説,名作');
    cy.get('[data-testid="book-add-submit"]').click();
    cy.url().should('include', '/book/', { timeout: 10000 });
    cy.get('[data-testid="book-detail"]').should('exist');
  });

  it('メモ入力時にタグ欄が空欄で開始される', () => {
    // メモ追加ボタンをクリック
    cy.get('[data-testid="memo-add-fab"]').click();
    
    // メモ入力フォームが表示されることを確認
    cy.get('[data-testid="memo-add-form"]').should('exist');
    
    // タグ入力欄が空欄であることを確認
    cy.get('[data-testid="memo-tags-input"]').should('have.value', '');
    
    // メモテキストを入力
    cy.get('[data-testid="memo-text-input"]').type('テストメモ');
    
    // メモを追加
    cy.get('[data-testid="memo-add-submit"]').click();
    
    // メモが追加されることを確認
    cy.get('[data-testid="memo-card"]', { timeout: 10000 }).should('exist');
  });

  it('メモ入力時にタグを手動で追加できる', () => {
    // メモ追加ボタンをクリック
    cy.get('[data-testid="memo-add-fab"]').click();
    
    // メモテキストを入力
    cy.get('[data-testid="memo-text-input"]').type('タグ付きテストメモ');
    
    // タグを手動で追加
    cy.get('[data-testid="memo-tags-input"]').type('感想,名言');
    
    // メモを追加（forceオプションを使用してAutocompleteのドロップダウンを無視）
    cy.get('[data-testid="memo-add-submit"]').click({ force: true });
    
    // メモが追加されることを確認
    cy.get('[data-testid="memo-card"]', { timeout: 10000 }).should('exist');
    
    // メモカードにタグが表示されることを確認
    cy.get('[data-testid="memo-card"]').should('contain', '感想');
    cy.get('[data-testid="memo-card"]').should('contain', '名言');
  });
});
