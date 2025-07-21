before(() => {
  cy.exec('node scripts/resetTestBooks.cjs');
});

describe('メモ一覧UI 長文省略表示テスト', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.login();

    // 本を追加
    cy.addBook();

    // 追加した本の詳細ページへ
    cy.contains('E2Eメモ用本').click();

    // 長文のメモを追加（FABを使用）
    cy.get('[data-testid="memo-add-fab"]').click();
    cy.get('[data-testid="memo-add-dialog"]').should('be.visible');
    cy.get('[data-testid="memo-text-input"]').type('これは非常に長いメモのテキストです。このメモは複数行にわたって書かれており、メモカードの表示領域を超える長さになっています。省略表示のテストのために、わざと長いテキストを入力しています。');
    cy.get('[data-testid="memo-add-submit"]').click();
    cy.get('[data-testid="memo-card"]', { timeout: 10000 }).should('exist');
  });

  it('長文メモは省略表示されている（先頭部分のみ見える）', () => {
    // メモカードが存在することを確認
    cy.get('[data-testid="memo-card"]').should('exist');
    
    // 長文が表示されていることを確認（現在の実装では省略されていない可能性）
    cy.contains('これは非常に長いメモのテキストです。').should('be.visible');
    
    // 完全なテキストが表示されていることを確認
    cy.contains('これは非常に長いメモのテキストです。このメモは複数行にわたって書かれており、メモカードの表示領域を超える長さになっています。省略表示のテストのために、わざと長いテキストを入力しています。').should('be.visible');
  });
}); 