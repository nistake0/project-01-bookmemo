before(() => {
  cy.exec('node scripts/resetTestBooks.cjs');
});

describe('メモ一覧UI 表示テスト', () => {
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

  it('メモカードが複数表示される', () => {
    // 複数のメモを追加
    cy.addMemo('2つ目のメモ');
    cy.addMemo('3つ目のメモ');

    // メモカードが3つ表示されることを確認
    cy.get('[data-testid="memo-card"]').should('have.length', 3);
  });

  it('メモカード全体をクリックすると詳細ダイアログが開く', () => {
    cy.get('[data-testid="memo-card"]').first().click();
    cy.get('[data-testid="memo-detail-dialog"]').should('be.visible');
  });
}); 