describe('ログイン画面のE2Eテスト', () => {
  it('ログイン画面が表示され、ログインボタン押下で本一覧に遷移する', () => {
    // ログイン画面にアクセス
    cy.visit('/login'); // 必要に応じてパスを修正

    // ログイン画面の要素確認
    cy.contains('ログイン').should('be.visible');
    cy.get('[data-testid="login-email-input"]').should('exist');
    cy.get('[data-testid="login-password-input"]').should('exist');
    cy.get('[data-testid="login-submit"]').should('exist');

    // テスト用ユーザーでログイン
    cy.get('[data-testid="login-email-input"]').type('testuser@example.com');
    cy.get('[data-testid="login-password-input"]').type('testpassword');
    cy.get('[data-testid="login-submit"]').click();

    // 本一覧画面に遷移したことを確認
    cy.url().should('include', '/'); // 必要に応じてパスを修正
    cy.contains('本一覧').should('be.visible');
  });
});

describe('本追加E2Eテスト', () => {
  beforeEach(() => {
    // ログイン処理
    cy.visit('/login');
    cy.get('[data-testid="login-email-input"]').type('testuser@example.com');
    cy.get('[data-testid="login-password-input"]').type('testpassword');
    cy.get('[data-testid="login-submit"]').click();
    cy.contains('本一覧', { timeout: 10000 }).should('be.visible');
  });

  it('本を追加できる', () => {
    // 「本を追加」ボタンをクリック
    cy.contains('button', '本を追加').click();

    // 「本を追加」画面のタイトルを確認
    cy.contains('本を追加').should('be.visible');

    // 各inputに値を入力
    cy.get('[data-testid="book-isbn-input"]').type('9781234567890');
    cy.get('[data-testid="book-title-input"]').type('E2Eテスト用タイトル');
    cy.get('[data-testid="book-author-input"]').type('E2Eテスト著者');
    cy.get('[data-testid="book-publisher-input"]').type('E2Eテスト出版社');
    cy.get('[data-testid="book-publishdate-input"]').type('2024-07-01');

    // 追加ボタンをクリック
    cy.get('[data-testid="book-add-submit"]').click();

    // 本一覧画面に戻り、追加した本が表示されていることを確認
    cy.contains('本一覧').should('be.visible');
    cy.contains('E2Eテスト用タイトル').should('be.visible');
    cy.contains('E2Eテスト著者').should('be.visible');
  });
});

/*
// 既存の本追加関連テストは一旦コメントアウト
// describe('本追加E2Eテスト', () => {
//   it('本を追加できる', () => {
//     // ... 既存のテストコード ...
//   });
// });
*/ 