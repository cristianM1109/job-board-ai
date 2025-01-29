describe('Upload CV Page', () => {
    beforeEach(() => {
      
      cy.login(); // 🔹 Simulează autentificarea utilizatorului
      cy.request('/').its('status').should('eq', 200);
      
      // 🔹 Interceptează request-ul pentru CV-uri încărcate
      cy.intercept('GET', 'http://localhost:5000/users/upload/cvs', {
        statusCode: 200,
        body: [
          { id: 'cv1', fileName: 'test-cv.pdf', filePath: 'uploads/test-cv.pdf', createdAt: new Date().toISOString() }
        ]
      }).as('getUserCvs');
  
      // 🔹 Vizitează pagina Upload CV
      cy.visit('/upload-cv');
      
      // 🔹 Așteaptă request-ul pentru a confirma că CV-urile sunt încărcate
      cy.wait('@getUserCvs');
    });
  
    it('should display the upload form and uploaded CVs', () => {
      cy.contains('Upload Your CV').should('be.visible');
      cy.get('input[type="file"]').should('exist');
      cy.get('button[type="submit"]').should('be.disabled'); // Butonul trebuie să fie dezactivat inițial
  
      // 🔹 Verifică că CV-ul încărcat este afișat
      cy.contains('Uploaded CVs').should('be.visible');
      cy.contains('test-cv.pdf').should('be.visible');
    });
  
    it('should restrict upload to only PDF files', () => {
      const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      cy.get('input[type="file"]').selectFile({
        contents: invalidFile,
        fileName: 'test.txt',
        mimeType: 'text/plain'
      }, { force: true });
  
      cy.contains('Only PDF files are allowed.').should('be.visible'); // Mesaj de eroare
    });
  
    it('should upload a CV successfully', () => {
      const pdfFile = new File(['test content'], 'my-cv.pdf', { type: 'application/pdf' });
  
      cy.get('input[type="file"]').selectFile({
        contents: pdfFile,
        fileName: 'my-cv.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
  
      cy.intercept('POST', 'http://localhost:5000/users/upload/upload-cv', {
        statusCode: 201,
        body: { message: 'CV uploaded successfully!' }
      }).as('uploadCv');
  
      cy.get('button[type="submit"]').click();
      cy.wait('@uploadCv');
  
      cy.contains('CV uploaded successfully!').should('be.visible');
    });
  
    it('should handle upload failure', () => {
      const pdfFile = new File(['test content'], 'my-cv.pdf', { type: 'application/pdf' });
  
      cy.get('input[type="file"]').selectFile({
        contents: pdfFile,
        fileName: 'my-cv.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
  
      cy.intercept('POST', 'http://localhost:5000/users/upload/upload-cv', {
        statusCode: 500,
        body: { error: 'Upload failed' }
      }).as('failedUpload');
  
      cy.get('button[type="submit"]').click();
      cy.wait('@failedUpload');
  
      cy.contains('Failed to upload CV. Please try again.').should('be.visible');
    });
  
    it('should delete a CV successfully', () => {
      cy.intercept('DELETE', 'http://localhost:5000/users/upload/cvs/cv1', {
        statusCode: 200
      }).as('deleteCv');
  
      cy.get('.cv-item').first().within(() => {
        cy.get('button').contains('Delete').click();
      });
  
      cy.on('window:confirm', () => true); // Confirmă ștergerea
  
      cy.wait('@deleteCv');
      cy.contains('test-cv.pdf').should('not.exist');
    });
  });
  