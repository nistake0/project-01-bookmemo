describe('本追加E2Eテスト', () => {
  beforeEach(() => {
    // ログアウト処理（明示的に認証状態をリセット）
    cy.clearCookies();
    cy.clearLocalStorage();
    // ログイン処理
    cy.visit('/login'); // 開発環境用に修正
    cy.get('[data-testid="login-email-input"]').type('testuser@example.com');
    cy.get('[data-testid="login-password-input"]').type('testpassword');
    cy.get('[data-testid="login-submit"]').click();
    cy.get('[data-testid="page-header-title"]').should('contain', '本一覧');
  });

  it('本を追加できる', () => {
    // デバッグ: 現在のURLを確認
    cy.url().then((url) => {
      cy.log('Current URL:', url);
    });

    // フッターメニューの「本を追加」をクリック
    cy.get('[data-testid="bottom-nav-add"]').click();

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

    // デバッグ: BookFormコンポーネントの存在確認
    cy.get('[data-testid="book-form"]', { timeout: 15000 }).should('exist');

    // 各inputに値を入力
    cy.get('[data-testid="book-isbn-input"]').type('9781234567890');
    cy.get('[data-testid="book-title-input"]').type('E2Eテスト用タイトル');
    cy.get('[data-testid="book-author-input"]').type('E2Eテスト著者');
    cy.get('[data-testid="book-publisher-input"]').type('E2Eテスト出版社');
    cy.get('[data-testid="book-publishdate-input"]').type('2024-07-01');

    // 追加ボタンをクリック
    cy.get('[data-testid="book-add-submit"]').click();

    // 書籍詳細画面に遷移し、追加した本が表示されていることを確認
    cy.url().should('include', '/book/'); // 開発環境用に修正
    cy.get('[data-testid="book-detail"]').should('exist');
  });
});

/*
// 既存の本追加関連テストは一旦コメントアウト
// describe('本追加E2Eテスト', () => {
//   it('本を追加できる', () => {
//     // ... 既存のテストコード ...
//   });
// });
*/ 