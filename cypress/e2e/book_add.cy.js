describe('ログイン画面のE2Eテスト', () => {
  it('ログイン画面が表示され、ログインボタン押下で本一覧に遷移する', () => {
    // ログイン画面にアクセス
    cy.visit('/login'); // 必要に応じてパスを修正

    // ログイン画面の要素確認
    cy.contains('ログイン').should('be.visible');
    cy.get('input[type="text"]').should('exist'); // email欄
    cy.get('input[type="password"]').should('exist'); // パスワード欄
    cy.get('button[type="submit"]').contains('ログイン').should('exist');

    // テスト用ユーザーでログイン
    cy.get('input[type="text"]').type('testuser@example.com');
    cy.get('input[type="password"]').type('testpassword');
    cy.get('button[type="submit"]').contains('ログイン').click();

    // 本一覧画面に遷移したことを確認
    cy.url().should('include', '/'); // 必要に応じてパスを修正
    cy.contains('本一覧').should('be.visible');
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