before(() => {
  cy.exec('node scripts/resetTestBooks.cjs');
});

describe.skip('メモカードクリック機能テスト', () => {
  beforeEach(() => {
    // クリーンアップ
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // ログイン処理
    cy.login();

    // 本を追加（簡潔な実装）
    cy.get('[data-testid="book-add-button"]').click();
    cy.url().should('include', '/add');
    
    // フォームに直接入力
    cy.get('[data-testid="book-isbn-input"]').type('9781234567890');
    cy.get('[data-testid="book-title-input"]').type('E2Eメモ用本');
    cy.get('[data-testid="book-author-input"]').type('E2E著者');
    cy.get('[data-testid="book-publisher-input"]').type('E2E出版社');
    cy.get('[data-testid="book-publishdate-input"]').type('2024-07-01');
    cy.get('[data-testid="book-add-submit"]').click();
    
    // 書籍詳細ページに遷移するまで待機
    cy.url().should('include', '/book/', { timeout: 10000 });

    // メモを追加
    cy.get('[data-testid="memo-add-fab"]').click();
    cy.get('[data-testid="memo-text-input"]').type('E2Eテスト用メモ');
    cy.get('[data-testid="memo-add-submit"]').click();
    cy.get('[data-testid="memo-card"]', { timeout: 10000 }).should('exist');
  });

  it('メモカード全体をクリックすると詳細ダイアログが開く', () => {
    cy.get('[data-testid="memo-card"]').first().click();
    cy.get('[data-testid="memo-detail-dialog"]').should('be.visible');
  });
}); 