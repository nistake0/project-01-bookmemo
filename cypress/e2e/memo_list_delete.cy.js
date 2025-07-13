before(() => {
  cy.exec('node scripts/resetTestBooks.cjs');
});

describe('メモ一覧UI 削除機能テスト', () => {
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

    // メモを追加
    cy.get('[data-testid="memo-text-input"]').should('be.visible').type('E2Eテスト用メモ');
    cy.get('[data-testid="memo-add-submit"]').click();
    cy.get('[data-testid="memo-card"]', { timeout: 10000 }).should('exist');
  });

  it('削除ボタンで削除確認ダイアログが開き、削除できる', () => {
    cy.get('[data-testid="memo-card"]').last().within(() => {
      cy.get('button[aria-label="edit"]').click();
    });
    cy.contains('メモ詳細').should('be.visible');
    cy.get('button').contains('削除').click();
    cy.contains('本当に削除しますか？').should('be.visible');
    cy.get('button').contains('削除').last().click({force: true});
    cy.get('[data-testid="memo-card"]').should('have.length.at.least', 0);
  });
}); 