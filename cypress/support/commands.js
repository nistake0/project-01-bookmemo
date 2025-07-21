// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
Cypress.Commands.add('login', (email = 'testuser@example.com', password = 'testpassword') => {
  cy.visit('/project-01-bookmemo/login');
  cy.get('[data-testid="login-email-input"]', { timeout: 10000 }).should('be.visible').type(email);
  cy.get('[data-testid="login-password-input"]').should('be.visible').type(password);
  cy.get('[data-testid="login-submit"]').should('be.visible').click();
  cy.contains('本一覧', { timeout: 10000 }).should('be.visible');
});

Cypress.Commands.add('addBook', (bookData = {}) => {
  const defaultBook = {
    isbn: '9781234567890',
    title: 'E2Eメモ用本',
    author: 'E2E著者',
    publisher: 'E2E出版社',
    publishDate: '2024-07-01'
  };
  const book = { ...defaultBook, ...bookData };
  
  cy.get('[data-testid="book-add-button"]').should('be.visible').click();
  cy.get('[data-testid="book-isbn-input"]').type(book.isbn);
  cy.get('[data-testid="book-title-input"]').type(book.title);
  cy.get('[data-testid="book-author-input"]').type(book.author);
  cy.get('[data-testid="book-publisher-input"]').type(book.publisher);
  cy.get('[data-testid="book-publishdate-input"]').type(book.publishDate);
  cy.get('[data-testid="book-add-submit"]').click();
  cy.contains(book.title, { timeout: 10000 }).should('be.visible');
});

Cypress.Commands.add('addMemo', (memoText = 'E2Eテスト用メモ') => {
  cy.get('[data-testid="memo-add-fab"]').click();
  cy.get('[data-testid="memo-text-input"]').should('be.visible').type(memoText);
  cy.get('[data-testid="memo-add-submit"]').click();
  cy.get('[data-testid="memo-card"]', { timeout: 10000 }).should('exist');
});

//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })