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
    cy.contains('本一覧', { timeout: 10000 }).should('be.visible');
  });

  it('本を追加できる', () => {
    // 「本を追加」ボタンをクリック
    cy.get('[data-testid="book-add-button"]').click();

    // 「本を追加」画面のタイトルを確認
    cy.get('[data-testid="book-add-title"]').should('be.visible');

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
    cy.contains('E2Eテスト用タイトル').should('be.visible');
    cy.contains('E2Eテスト著者').should('be.visible');
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