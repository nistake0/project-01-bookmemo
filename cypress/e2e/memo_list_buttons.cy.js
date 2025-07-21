before(() => {
  cy.exec('node scripts/resetTestBooks.cjs');
});

describe('メモ一覧UI 編集・削除ボタン存在テスト', () => {
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

  it('各カードに編集・削除ボタンがある（デスクトップ）', () => {
    // デスクトップサイズでテスト
    cy.viewport(1200, 800);
    
    cy.get('[data-testid="memo-card"]').each(($card) => {
      cy.wrap($card).find('[data-testid="memo-edit-button"]').should('exist');
      cy.wrap($card).find('[data-testid="memo-delete-button"]').should('exist');
    });
  });

  it('モバイルでは編集・削除ボタンが非表示（スワイプアクション使用）', () => {
    // モバイルサイズでテスト
    cy.viewport(375, 667);
    
    cy.get('[data-testid="memo-card"]').each(($card) => {
      cy.wrap($card).find('[data-testid="memo-edit-button"]').should('not.exist');
      cy.wrap($card).find('[data-testid="memo-delete-button"]').should('not.exist');
    });
  });
}); 