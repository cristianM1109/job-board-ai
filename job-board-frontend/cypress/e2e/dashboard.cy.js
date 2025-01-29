describe('Dashboard Page', () => {
    beforeEach(() => {
      cy.login(); // Asigură autentificarea utilizatorului
  
      cy.intercept('GET', 'http://localhost:5000/users/upload/cvs', {
        statusCode: 200,
        body: [{ id: 'cv123', fileName: 'My CV', filePath: '/uploads/cv.pdf' }]
      }).as('getUserCvs');
  
      cy.intercept('GET', 'http://localhost:5000/api/favorites', {
        statusCode: 200,
        body: [
          {
            id: '2',
            title: 'Software Engineer',
            company: 'TechCorp',
            location: 'Remote',
            salary: '100K',
            url: 'https://example.com/job/software-engineer'
          }
        ]
      }).as('getFavoriteJobs');
  
      cy.intercept('GET', 'http://localhost:5000/api/jobs/analyze-job/2', {
        statusCode: 200,
        body: {
          analysis: {
            matched_skills: ['JavaScript', 'Node.js'],
            missing_skills: ['Python'],
            recommendations: 'Consider learning Python for backend development.'
          }
        }
      }).as('analyzeJob');

      cy.intercept('GET', 'http://localhost:5000/api/jobs/external-jobs?page=1&limit=1000', {
        statusCode: 200,
        body: {
            "count": 1750,
            "jobs": [
                {
                    "id": "1",
                    "role": "Frontend Developer",
                    "companyName": "InnovateTech",
                    "company_num_employees": null,
                    "employment_type": null,
                    "location": "Boston, MA",
                    "remote": "Hybrid",
                    "logo": null,
                    "url": "https://example.com/job/frontend-developer",
                    "description": "Frontend development role with React.",
                    "date_posted": "2025-01-28T20:16:00Z",
                    "keywords": [],
                    "source": "Coroflot"
                }]
            }
      }).as('externalJobs');


  
      cy.intercept('GET', 'http://localhost:5000/api/jobs/recommend-jobs', {
        statusCode: 200,
        body: {
          recommendations: [{ job_id: '1' }]
        }
      }).as('getJobRecommendations');
  
      
      cy.visit('/app-dashboard'); // Navighează la Dashboard
      cy.wait(['@getUserCvs', '@getFavoriteJobs', '@getJobRecommendations','@externalJobs'], { timeout: 5000 });
    });
  
    it('should display favorite jobs', () => {
      cy.contains('💼 Joburi Favorite').should('be.visible');
      cy.get('.job-card.favorite').should('have.length', 1);
  
      cy.get('.job-card.favorite').first().within(() => {
        cy.contains('Software Engineer').should('be.visible');
        cy.contains('TechCorp').should('be.visible');
        cy.contains('Locație: Remote').should('be.visible');
        cy.contains('100K').should('be.visible');
      });
    });
  
    it('should display recommended jobs', () => {
      cy.contains('🌟 Recommended for you').should('be.visible');
      cy.get('.spinner-container', { timeout: 5000 }).should('not.exist');
      cy.get('.job-card.recommended').should('have.length', 1);
      
      cy.get('.job-card.recommended').first().within(() => {
        cy.contains('Frontend Developer').should('be.visible');
        cy.contains('InnovateTech').should('be.visible');
        cy.contains('Boston, MA').should('be.visible');
        cy.get('.job-details').should('not.exist');

        cy.get('.details-button').click();
    
        cy.get('.job-details').should('be.visible');
        cy.contains('Frontend development role with React.').should('be.visible');
      });
    });
  
    it('should show job details when clicking "Vezi Detalii"', () => {
      cy.get('.job-card.recommended').first().within(() => {
        cy.get('.details-button').click();
        cy.contains('Frontend development role with React.').should('be.visible');
      });
    });
  
    it('should analyze a job and show recommendations', () => {
      cy.get('.analyze-button').click();
      cy.wait('@analyzeJob');
      cy.contains('📊 Recomandări AI').should('be.visible');
      cy.contains('JavaScript, Node.js').should('be.visible');
      cy.contains('Python').should('be.visible');
      cy.contains('Consider learning Python for backend development.').should('be.visible');
    });
  
    it('should open job application link in a new tab', () => {
      cy.window().then((win) => {
        cy.stub(win, 'open').as('windowOpen');
      });
      cy.get('.details-button').click();
      cy.get('.apply-button').click();
      cy.get('@windowOpen').should('have.been.calledWith', 'https://example.com/job/frontend-developer');
    });
  });
  