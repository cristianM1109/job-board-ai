describe('External Jobs Filtering', () => {
    beforeEach(() => {
      cy.login(); // Asigură autentificarea utilizatorului
  
      cy.intercept('GET', 'http://localhost:5000/api/jobs/external-jobs*', (req) => {
        // Extragem parametrii din query string (sau fallback la valori implicite)
        const { page = '1', limit = '50', title = '', company = '', location = '', remote = '' } = req.query;
      
        let allJobs = [
          {
            id: '1',
            role: 'Frontend Developer',
            companyName: 'TechCorp',
            location: 'Bucharest',
            remote: false,
            url: 'https://example.com/job/1',
            description: 'Build and maintain frontend applications.',
          },
          {
            id: '2',
            role: 'Backend Developer',
            companyName: 'InnovateTech',
            location: 'Remote',
            remote: true,
            url: 'https://example.com/job/2',
            description: 'Develop scalable backend services.',
          }
        ];
      
        let filteredJobs = [...allJobs]; // Facem o copie inițială
      
        // Aplicăm filtrările doar dacă există parametri (excludem `page` și `limit`)
        if (title) {
          filteredJobs = filteredJobs.filter(job => job.role.toLowerCase().includes(title.toLowerCase()));
        }
        if (company) {
          filteredJobs = filteredJobs.filter(job => job.companyName.toLowerCase().includes(company.toLowerCase()));
        }
        if (location) {
          filteredJobs = filteredJobs.filter(job => job.location.toLowerCase().includes(location.toLowerCase()));
        }
        if (remote === 'true') {
          filteredJobs = filteredJobs.filter(job => job.remote === true);
        }
        if (remote === 'false') {
          filteredJobs = filteredJobs.filter(job => job.remote === false);
        }
      
        req.reply({
          statusCode: 200,
          body: {
            count: filteredJobs.length, // Numărul de joburi returnate
            jobs: filteredJobs.slice(0, parseInt(limit, 10)) // Paginăm rezultatul
          }
        });
      }).as('getExternalJobs');
  
      cy.visit('/external-jobs'); // Navigăm la pagina de joburi externe
      cy.wait('@getExternalJobs');
    });
  
    it('should filter jobs by title', () => {
      cy.get('input[placeholder="Search by title"]').type('Frontend');
      cy.get('button').contains('Apply Filters').click();
  
      cy.wait('@getExternalJobs');
  
      cy.get('.job-card').should('have.length', 1);
      cy.contains('Frontend Developer').should('be.visible');
      cy.contains('Backend Developer').should('not.exist');
    });
  
    it('should filter jobs by company name', () => {
      cy.get('input[placeholder="Search by company"]').type('InnovateTech');
      cy.get('button').contains('Apply Filters').click();
  
      cy.wait('@getExternalJobs');
  
      cy.get('.job-card').should('have.length', 1);
      cy.contains('Backend Developer').should('be.visible');
      cy.contains('Frontend Developer').should('not.exist');
    });
  
    it('should filter jobs by location', () => {
      cy.get('input[placeholder="Search by location"]').type('Bucharest');
      cy.get('button').contains('Apply Filters').click();
  
      cy.wait('@getExternalJobs');
  
      cy.get('.job-card').should('have.length', 1);
      cy.contains('Frontend Developer').should('be.visible');
      cy.contains('Backend Developer').should('not.exist');
    });
  
    it('should filter jobs by remote status', () => {
      cy.get('select').select('Remote');
      cy.get('button').contains('Apply Filters').click();
  
      cy.wait('@getExternalJobs');
  
      cy.get('.job-card').should('have.length', 1);
      cy.contains('Backend Developer').should('be.visible');
      cy.contains('Frontend Developer').should('not.exist');
    });
  
    it('should reset filters and show all jobs', () => {
      cy.get('input[placeholder="Search by title"]').type('Frontend');
      cy.get('button').contains('Apply Filters').click();
      cy.wait('@getExternalJobs');
  
      cy.get('button').contains('Reset Filters').click();
      cy.wait('@getExternalJobs');
  
      cy.get('.job-card').should('have.length', 2);
      cy.contains('Frontend Developer').should('be.visible');
      cy.contains('Backend Developer').should('be.visible');
    });
  });
  