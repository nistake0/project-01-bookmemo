describe('ログイン画面のE2Eテスト', () => {
  it('ログイン画面が表示され、ログインボタン押下で本一覧に遷移する', () => {
    // ログイン画面にアクセス
    cy.visit('/project-01-bookmemo/login'); // baseUrlに合わせて修正

    // ログイン画面の要素確認
    cy.contains('ログイン').should('be.visible');
    cy.get('[data-testid="login-email-input"]').should('exist');
    cy.get('[data-testid="login-password-input"]').should('exist');
    cy.get('[data-testid="login-submit"]').should('exist');

    // テスト用ユーザーでログイン
    cy.get('[data-testid="login-email-input"]').type('testuser@example.com');
    cy.get('[data-testid="login-password-input"]').type('testpassword');
    cy.get('[data-testid="login-submit"]').click();

    // 本一覧画面に遷移したことを確認
    cy.url().should('include', '/project-01-bookmemo/'); // baseUrlに合わせて修正
    cy.contains('本一覧').should('be.visible');
  });
}); 