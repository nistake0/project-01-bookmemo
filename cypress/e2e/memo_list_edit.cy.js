before(() => {
  cy.exec('node scripts/resetTestBooks.cjs');
});

describe('メモ一覧UI 編集機能テスト', () => {
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

  it('編集ボタンで編集ダイアログが開き、内容を変更して保存できる', () => {
    // デスクトップサイズでテスト
    cy.viewport(1200, 800);
    
    // 編集ボタンをクリック
    cy.get('[data-testid="memo-edit-button"]').first().click();
    
    // 編集ダイアログが開くことを確認
    cy.get('[data-testid="memo-detail-dialog"]').should('be.visible');
    
    // 編集モードに切り替える
    cy.get('[data-testid="memo-edit-button"]').click();
    
    // 内容を変更
    cy.get('[data-testid="memo-text-input"]').clear().type('編集されたメモ');
    cy.get('[data-testid="memo-comment-input"]').clear().type('編集されたコメント');
    
    // 保存ボタンをクリック
    cy.get('[data-testid="memo-update-button"]').click();
    
    // ダイアログが閉じることを確認
    cy.get('[data-testid="memo-detail-dialog"]').should('not.exist');
    
    // 変更が反映されることを確認
    cy.contains('編集されたメモ').should('be.visible');
  });
}); 