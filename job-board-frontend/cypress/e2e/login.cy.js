describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('/login'); // Navighează la pagina de login
  });

  it('should display the login form', () => {
    cy.get('.login-container').should('be.visible');
    cy.get('h2').should('contain', 'Login');
    cy.get('input[name="username"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('.btn-submit').should('be.visible');
  });

  it('should allow user to enter username and password', () => {
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('password123');

    cy.get('input[name="username"]').should('have.value', 'testuser');
    cy.get('input[name="password"]').should('have.value', 'password123');
  });

  it('should show error message on failed login', () => {
    cy.intercept('POST', '**/api/login', { statusCode: 409, body: { error: 'Invalid credentials!' } });

    cy.get('input[name="username"]').type('wronguser');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('.btn-submit').click();

    cy.get('.error-message').should('contain', 'Invalid credentials!');
  });

  it('should redirect to jobs page on successful login', () => {
    cy.intercept('POST', '**/api/login', {
      statusCode: 200,
      body: { token: 'fake-jwt-token' }
    });

    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('password123');
    cy.get('.btn-submit').click();

    cy.url().should('include', '/jobs'); // Verifică redirecționarea după login
  });
});
