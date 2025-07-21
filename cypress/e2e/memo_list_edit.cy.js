before(() => {
  cy.exec('node scripts/resetTestBooks.cjs');
});

describe('メモ一覧UI 編集機能テスト', () => {
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

  it('編集ボタンで編集ダイアログが開き、内容を変更して保存できる', () => {
    cy.get('[data-testid="memo-card"]').first().within(() => {
      cy.get('[data-testid="memo-edit-button"]').click();
    });
    cy.get('[data-testid="memo-detail-title"]').should('be.visible');
    // メモ詳細画面の要素が表示されていることを確認
    cy.get('[data-testid="memo-edit-button"]').should('be.visible');
    cy.get('[data-testid="memo-delete-button"]').should('be.visible');
    cy.get('[data-testid="memo-close-button"]').should('be.visible');
    // メモ詳細画面のDialogActions内の編集ボタンをクリック
    cy.get('[data-testid="memo-detail-dialog"]').find('[data-testid="memo-edit-button"]').click();
    // 編集モードに切り替わるまで待つ
    cy.get('[data-testid="memo-update-button"]', { timeout: 10000 }).should('be.visible');
    cy.get('textarea[label="引用・抜き書き"], textarea').first().clear({force: true}).type('E2Eテストで編集', {force: true});
    cy.get('[data-testid="memo-update-button"]').click();
    cy.contains('E2Eテストで編集').should('exist');
  });
}); 