# Job Board AI - Backend (Node.js)

This is the primary backend API, built with Node.js and Express.

##  Installation & Setup
```sh
npm install
npm start

Endpoint	                            Method	 Description

/users/upload/upload-cv 	 			POST   - Uploads a CV file for a user
/users/upload/cvs        	 			GET    - Get a user's CVs files
/users/upload/cvs/:cvId 	 			DELETE - Delete a CV file
/api/favorites				 			POST   - Add a job listing to favorites
/api/favorites				 			GET    - Get user's favorite jobs
/api/favorites/:jobId   	 			DELETE - Delete a specific job from favorites
/api/jobs/external-jobs 	 			GET    - Fetch external job listings
/api/jobs/recommend-jobs     			GET    - Get a list of recomended jobs based on last CV file updated
/api/jobs/analyze-job/:jobId 			GET    - Analyze a job with AI
/users/register        	 	 			POST   - Register new user
/users/login            	 			POST   - Login existing user
/users/me              	  	 			GET    - Check if a user if authenticated
/analysis/process-cv   		 			POST   - Calculates semantinc compatibility scores for the favorite jobs and the last updated CV
/analysis/keyword-compatibility-scores  GET    - Calculates common keyword compatibility score for the favorite jobs and the last updated CV


Create a .env file in the root directory:

FINDWORK_API_KEY='API_KEY'
JWT_SECRET=mongodb:'job_app_secret_key'
FLASK_SERVICE_URL=http://localhost:4500/process-cv'

 Running Tests
npm test