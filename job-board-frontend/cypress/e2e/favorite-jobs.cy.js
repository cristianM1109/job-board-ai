describe('Favorite Jobs Page', () => {
    beforeEach(() => {
      cy.login(); // 🔹 Asigură autentificarea utilizatorului
      cy.request('/').its('status').should('eq', 200); // Verifică că serverul răspunde
      
      cy.intercept('GET', 'http://localhost:5000/users/upload/cvs', {
        statusCode: 200,
        body: [{ id: '123', name: 'My CV', filePath: '/uploads/test-cv.pdf' }]
      }).as('getUserCvs');
  
      cy.intercept('GET', 'http://localhost:5000/api/favorites', {
        statusCode: 200,
        body: [
          {
            id: '1',
            title: 'Software Engineer',
            company: 'TechCorp',
            location: 'Remote',
            description: 'Exciting opportunity for developers!',
            logo: 'https://example.com/logo.png',
            url: 'https://example.com/job/software-engineer'
          }
        ]
      }).as('getFavoriteJobs');
  
      cy.intercept('POST', 'http://localhost:5000/analysis/process-cv', {
        statusCode: 200,
        body: {
          scores: { '1': { score: 0.85 } }
        }
      }).as('getCompatibilityScores');
  
      cy.intercept('GET', 'http://localhost:5000/analysis/keyword-compatibility-scores', {
        statusCode: 200,
        body: {
          scores: { '1': { score: 0.90 } }
        }
      }).as('getKeywordScores');
      cy.visit('/jobs'); // Ac
      cy.wait(['@getUserCvs', '@getFavoriteJobs'], { timeout: 5000 });
    });
  
    it('should display favorite jobs list and compatibility scores', () => {
      cy.contains('My Saved Jobs').should('be.visible');
      cy.get('.job-card').should('have.length', 1);
      cy.reload();
      cy.wait(['@getCompatibilityScores', '@getKeywordScores'], { timeout: 5000 });
      cy.get('.job-card').first().within(() => {
        cy.contains('Software Engineer').should('be.visible');
        cy.contains('TechCorp').should('be.visible');
        cy.contains('Location: Remote').should('be.visible');
        cy.get('.job-logo').should('be.visible');
      });
  
      // Verificăm că graficul este afișat corect
      cy.get('h3').should('contain', 'Compatibility Scores (In-Depth Match)');
  
      // Schimbăm vizualizarea
      cy.get('#view-selector').select('keywords');
      cy.get('h3').should('contain', 'Compatibility Scores (Keyword Focus)');
    });
  
    it('should show loading spinner while fetching jobs', () => {
      cy.intercept('GET', 'http://localhost:5000/api/favorites', (req) => {
        req.reply((res) => {
          res.send({
            statusCode: 200,
            body: [],
            delay: 2000 // Întârziere de 2 secunde
          });
        });
      }).as('delayedFavoriteJobs');
  
      cy.visit('/jobs');
      cy.get('.loading-spinner-container').should('be.visible');
      cy.wait('@delayedFavoriteJobs');
      cy.get('.loading-spinner-container').should('not.exist');
    });
  
    it('should remove a job from favorites', () => {
      cy.intercept('DELETE', 'http://localhost:5000/api/favorites/1', {
        statusCode: 200
      }).as('deleteFavoriteJob');
  
      cy.get('.job-card').first().within(() => {
        cy.get('.remove-button').click();
      });
  
      cy.on('window:confirm', () => true);
  
      cy.wait('@deleteFavoriteJob');
      cy.get('.job-card').should('have.length', 0);
      cy.contains('You have no favorite jobs.').should('be.visible');
    });
  });
  