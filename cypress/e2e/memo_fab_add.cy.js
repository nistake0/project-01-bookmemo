before(() => {
  cy.exec('node scripts/resetTestBooks.cjs');
});

describe('FABメモ追加機能テスト', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.login();

    // 本を追加
    cy.addBook({
      title: 'E2E FABメモ用本',
      author: 'E2E FAB著者',
      publisher: 'E2E FAB出版社'
    });

    // 追加した本の詳細ページへ
    cy.contains('E2E FABメモ用本').click();
  });

  it('FABをクリックするとメモ追加ダイアログが開く', () => {
    cy.get('[data-testid="memo-add-fab"]').should('be.visible').click();
    cy.get('[data-testid="memo-add-dialog"]').should('be.visible');
  });

  it('FABでメモを追加できる', () => {
    cy.get('[data-testid="memo-add-fab"]').click();
    cy.get('[data-testid="memo-add-dialog"]').should('be.visible');
    
    // メモを入力
    cy.get('[data-testid="memo-text-input"]').type('FABで追加したメモ');
    cy.get('[data-testid="memo-comment-input"]').type('FABテスト用コメント');
    cy.get('[data-testid="memo-page-input"]').type('42');
    
    // メモを追加
    cy.get('[data-testid="memo-add-submit"]').click();
    
    // ダイアログが閉じることを確認
    cy.get('[data-testid="memo-add-dialog"]').should('not.exist');
    
    // メモが追加されたことを確認
    cy.get('[data-testid="memo-card"]').should('exist');
    cy.contains('FABで追加したメモ').should('be.visible');
  });

  it('キャンセルボタンでダイアログが閉じる', () => {
    cy.get('[data-testid="memo-add-fab"]').click();
    cy.get('[data-testid="memo-add-dialog"]').should('be.visible');
    
    cy.get('[data-testid="memo-add-cancel"]').click();
    cy.get('[data-testid="memo-add-dialog"]').should('not.exist');
  });
}); 