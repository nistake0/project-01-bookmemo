describe('ログイン画面のE2Eテスト', () => {
  it('ログイン画面が表示され、ログインボタン押下で本一覧に遷移する', () => {
    // ログイン画面にアクセス
    cy.visit('/login'); // 開発環境用に修正

    // ログイン画面の要素確認
    cy.get('[data-testid="login-title"]').should('be.visible');
    cy.get('[data-testid="login-email-input"]').should('exist');
    cy.get('[data-testid="login-password-input"]').should('exist');
    cy.get('[data-testid="login-submit"]').should('exist');

    // テスト用ユーザーでログイン
    cy.get('[data-testid="login-email-input"]').type('testuser@example.com');
    cy.get('[data-testid="login-password-input"]').type('testpassword');
    cy.get('[data-testid="login-submit"]').click();

    // 本一覧画面に遷移したことを確認
    cy.url().should('include', '/'); // 開発環境用に修正
    cy.get('[data-testid="book-list-title"]').should('be.visible');
  });
}); 