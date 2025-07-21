before(() => {
  cy.exec('node scripts/resetTestBooks.cjs');
});

describe('メモカードクリック機能テスト', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.login();

    // 本を追加
    cy.addBook();

    // 追加した本の詳細ページへ
    cy.contains('E2Eメモ用本').click();

    // メモを追加（FABを使用）
    cy.addMemo();
  });

  it('メモカード全体をクリックすると詳細ダイアログが開く', () => {
    cy.get('[data-testid="memo-card"]').first().click();
    cy.get('[data-testid="memo-detail-dialog"]').should('be.visible');
  });
}); 