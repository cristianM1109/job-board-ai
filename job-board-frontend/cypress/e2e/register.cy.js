describe('Register Page', () => {
    beforeEach(() => {
      cy.visit('/register'); // Navighează la pagina de register
    });
  
    it('should display the register form', () => {
      cy.get('.register-container').should('be.visible');
      cy.get('h2').should('contain', 'Register');
      cy.get('input[name="username"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('input[name="confirmPassword"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });
  
    it('should allow user to enter registration details', () => {
      cy.get('input[name="username"]').type('newuser');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password123');
  
      cy.get('input[name="username"]').should('have.value', 'newuser');
      cy.get('input[name="password"]').should('have.value', 'password123');
      cy.get('input[name="confirmPassword"]').should('have.value', 'password123');
    });
  
    it('should show an error if passwords do not match', () => {
      cy.get('input[name="username"]').type('newuser');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password456'); // Diferit de parola
  
      cy.get('button[type="submit"]').click();
      cy.get('.error-message').should('contain', 'Passwords do not match!');
    });
  
    it('should show an error if registration fails', () => {
      cy.intercept('POST', '**/api/register', { statusCode: 400, body: { message: 'Username already exists' } });
  
      cy.get('input[name="username"]').type('existinguser');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password123');
      cy.get('button[type="submit"]').click();
  
      cy.get('.error-message').should('contain', 'Username already taken');
    });
  
    it('should redirect to login page after successful registration', () => {
      cy.intercept('POST', '**/api/register', { statusCode: 201 });
  
      cy.get('input[name="username"]').type('newuser11');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password123');
      cy.get('button[type="submit"]').click();
  
      cy.url().should('include', '/login'); // Verifică redirecționarea după înregistrare
    });
  });
  