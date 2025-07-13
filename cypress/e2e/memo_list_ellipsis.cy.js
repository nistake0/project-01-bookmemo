before(() => {
  cy.exec('node scripts/resetTestBooks.cjs');
});

describe('メモ一覧UI 長文省略表示テスト', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/project-01-bookmemo/login');
    cy.get('[data-testid="login-email-input"]').type('testuser@example.com');
    cy.get('[data-testid="login-password-input"]').type('testpassword');
    cy.get('[data-testid="login-submit"]').click();
    cy.contains('本一覧', { timeout: 10000 }).should('be.visible');

    // 本を追加
    cy.get('[data-testid="book-add-button"]').should('be.visible').click();
    cy.get('[data-testid="book-isbn-input"]').type('9781234567890');
    cy.get('[data-testid="book-title-input"]').type('E2Eメモ用本');
    cy.get('[data-testid="book-author-input"]').type('E2E著者');
    cy.get('[data-testid="book-publisher-input"]').type('E2E出版社');
    cy.get('[data-testid="book-publishdate-input"]').type('2024-07-01');
    cy.get('[data-testid="book-add-submit"]').click();
    cy.contains('E2Eメモ用本', { timeout: 10000 }).should('be.visible');

    // 追加した本の詳細ページへ
    cy.contains('E2Eメモ用本').click();

    // 長文メモを追加
    const longText = '長文テスト1行目\n長文テスト2行目\n長文テスト3行目';
    cy.get('[data-testid="memo-text-input"]').should('be.visible').type(longText);
    cy.get('[data-testid="memo-add-submit"]').click();
    cy.get('[data-testid="memo-card"]', { timeout: 10000 }).should('exist');
  });

  it('長文メモは省略表示されている（先頭部分のみ見える）', () => {
    cy.get('[data-testid="memo-card"]').contains('長文テスト1行目').should('exist');
    cy.get('[data-testid="memo-card"]').contains('長文テスト3行目').should('not.exist');
  });
}); 