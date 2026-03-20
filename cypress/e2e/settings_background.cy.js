/**
 * 設定画面の背景選択 E2E テスト
 * doc/design-background-customization-20250320.md に基づく
 */
describe('設定画面の背景選択', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('[data-testid="login-email-input"]').type('testuser@example.com');
    cy.get('[data-testid="login-password-input"]').type('testpassword');
    cy.get('[data-testid="login-submit"]').click();
    cy.url().should('include', '/');
  });

  it('設定画面で背景セクションが表示され、背景を選択できる', () => {
    cy.get('[data-testid="bottom-nav-settings"]').click();
    cy.url().should('include', '/settings');

    cy.get('[data-testid="theme-preset-library-classic"]').click();
    cy.get('[data-testid="settings-background-section"]').should('be.visible');
    cy.get('[data-testid="background-preset-none"]').should('be.visible');
    cy.get('[data-testid="background-preset-library"]').should('be.visible');
    cy.get('[data-testid="background-preset-library-patterned"]').should('be.visible');

    cy.get('[data-testid="background-preset-library"]').click();
    cy.get('[data-testid="background-preset-library"]').should('exist');

    cy.get('[data-testid="background-preset-none"]').click();
    cy.get('[data-testid="background-color-picker"]').should('be.visible');
    cy.get('[data-testid="background-color-input"]').should('be.visible');
  });

  it('ミニマル（ライト）テーマ選択時は背景セクションが非表示', () => {
    cy.get('[data-testid="bottom-nav-settings"]').click();
    cy.url().should('include', '/settings');

    cy.get('[data-testid="theme-preset-minimal-light"]').click();
    cy.get('[data-testid="settings-background-section"]').should('not.exist');
  });
});
