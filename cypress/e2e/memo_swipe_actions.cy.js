before(() => {
  cy.exec('node scripts/resetTestBooks.cjs');
});

describe('Memo Swipe Actions', () => {
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

  it('shows swipe actions when swiping memo card', () => {
    // メモカードが存在することを確認
    cy.get('[data-testid="memo-card"]').should('exist');
    
    // メモカードを左にスワイプ
    cy.get('[data-testid="memo-card"]').first()
      .trigger('mousedown', { position: 'right' })
      .trigger('mousemove', { position: 'left', force: true })
      .trigger('mouseup');
    
    // スワイプアクションが表示されることを確認
    // SwipeableListが存在することを確認
    cy.get('[data-testid="swipeable-list"]').should('exist');
  });

  it('opens edit dialog when edit swipe action is triggered', () => {
    // メモカードを左にスワイプして編集アクションを実行
    cy.get('[data-testid="memo-card"]').first()
      .trigger('mousedown', { position: 'right' })
      .trigger('mousemove', { position: 'left', force: true })
      .trigger('mouseup');
    
    // 編集ボタンをクリック
    cy.get('[data-testid="memo-card"]').first()
      .find('button[aria-label="edit"]')
      .click();
    
    // 編集ダイアログが開くことを確認
    cy.get('[data-testid="memo-detail-dialog"]').should('be.visible');
  });

  it('opens delete confirmation when delete swipe action is triggered', () => {
    // メモカードを左にスワイプして削除アクションを実行
    cy.get('[data-testid="memo-card"]').first()
      .trigger('mousedown', { position: 'right' })
      .trigger('mousemove', { position: 'left', force: true })
      .trigger('mouseup');
    
    // 削除ボタンをクリック
    cy.get('[data-testid="memo-card"]').first()
      .find('button[aria-label="delete"]')
      .click();
    
    // 削除確認ダイアログが開くことを確認
    cy.get('[data-testid="memo-delete-dialog"]').should('be.visible');
  });

  it('maintains desktop buttons for larger screens', () => {
    // デスクトップサイズでテスト
    cy.viewport(1200, 800);
    
    // デスクトップ用のボタンが存在することを確認
    cy.get('[data-testid="memo-edit-button"]').should('exist');
    cy.get('[data-testid="memo-delete-button"]').should('exist');
    
    // デスクトップ用の編集ボタンをクリック
    cy.get('[data-testid="memo-edit-button"]').first().click();
    
    // 編集ダイアログが開くことを確認
    cy.get('[data-testid="memo-detail-dialog"]').should('be.visible');
  });

  it('allows card click to open detail dialog', () => {
    // メモカードをクリック
    cy.get('[data-testid="memo-card"]').first().click();
    
    // 詳細ダイアログが開くことを確認
    cy.get('[data-testid="memo-detail-dialog"]').should('be.visible');
  });
}); 