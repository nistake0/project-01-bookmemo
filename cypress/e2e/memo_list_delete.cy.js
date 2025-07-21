before(() => {
  cy.exec('node scripts/resetTestBooks.cjs');
});

describe('メモ一覧UI 削除機能テスト', () => {
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

  it('削除ボタンで削除確認ダイアログが開き、削除できる', () => {
    // デスクトップサイズでテスト
    cy.viewport(1200, 800);
    
    // 削除ボタンをクリック
    cy.get('[data-testid="memo-delete-button"]').first().click();
    
    // 削除確認ダイアログが開くことを確認
    cy.get('[data-testid="memo-delete-dialog"]').should('be.visible');
    cy.get('[data-testid="memo-delete-confirm-title"]').should('contain', '本当に削除しますか？');
    
    // 削除を確認
    cy.get('[data-testid="memo-delete-confirm-button"]').click();
    
    // ダイアログが閉じることを確認
    cy.get('[data-testid="memo-delete-dialog"]').should('not.exist');
    
    // メモが削除されることを確認
    cy.get('[data-testid="memo-card"]').should('not.exist');
  });
}); 