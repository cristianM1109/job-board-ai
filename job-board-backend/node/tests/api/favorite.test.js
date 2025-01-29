const SequelizeMock = require('sequelize-mock');
const dbMock = new SequelizeMock();

// Mock-uri pentru modele
const UserMock = dbMock.define('User');
const CVMock = dbMock.define('CV');
const JobMock = dbMock.define('Job');
const FavoriteMock = dbMock.define('Favorite');

// Definirea relațiilor
UserMock.hasMany(CVMock, { foreignKey: 'userId' });
CVMock.belongsTo(UserMock, { foreignKey: 'userId' });

UserMock.hasMany(FavoriteMock, { foreignKey: 'userId' });
FavoriteMock.belongsTo(UserMock, { foreignKey: 'userId' });

JobMock.hasMany(FavoriteMock, { foreignKey: 'jobId' });
FavoriteMock.belongsTo(JobMock, { foreignKey: 'jobId' });

// Mock-urile pentru jest
jest.mock('../../src/models/User', () => UserMock);
jest.mock('../../src/models/CV', () => CVMock);
jest.mock('../../src/models/Job', () => JobMock);
jest.mock('../../src/models/Favorite', () => FavoriteMock);

const request = require('supertest');
const app = require('../../app'); // Aplicația Express
const Favorite = require('../../src/models/Favorite');
const sequelize = require('../../src/config/database'); // Configurația bazei de date
const Job = require('../../src/models/Job'); // Importăm modelul Job
const User = require('../../src/models/User'); // Modelul User
const jwt = require('jsonwebtoken');
const redisClient = require('../../redis');
const JWT_SECRET = process.env.JWT_SECRET;

jest.mock('../../src/models/Job', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
  }));
  
  jest.mock('../../src/models/Favorite', () => ({
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
  }));
  
describe('Favorites API', () => {
  let token;

  beforeAll(async () => {
    token = jwt.sign({ id: 1, username: 'testuser' }, JWT_SECRET, { expiresIn: '1h' });
    await sequelize.sync({ force: true });

    await User.create({
        id: 1,
        username: 'testuser',
        password: 'hashedpassword', // Dacă există validare, asigură-te că parola e "hashed"
      });
  });

  

  beforeEach(() => {
    jest.clearAllMocks();
    Job.findOne = jest.fn(); // Reasigură mock-ul
    Job.create = jest.fn();
    Favorite.findOne = jest.fn();
    Favorite.create = jest.fn();
    Favorite.findAll = jest.fn();
    Favorite.destroy = jest.fn();
  });
  
  
  afterAll(async () => {
    // Închide conexiunea după teste
    await sequelize.close();
    await redisClient.disconnect();
  });

  describe('POST /api/favorites', () => {
    it('should add a job to favorites', async () => {
      const jobData = {
        id: 1, // ID-ul din API extern
        role: 'Software Engineer',
        text: 'Develop and maintain software',
        company_name: 'TechCorp',
        location: 'Remote',
        salary: null,
        employment_type: 'Contract',
        remote: true,
        logo: 'https:logo',
        url: 'URL',
        date_posted: "2025-01-26T05:00:00Z",
        keywords: ['java'],
        source: 'source',
      };

      const jobDatabaseData = {
        id: 1, // ID-ul din API extern
        title: 'Software Engineer', // După transformare
        description: 'Develop and maintain software', // După transformare
        company: 'TechCorp', // După transformare
        location: 'Remote',
        salary: null,
        employmentType: 'Contract', // După transformare
        remote: true,
        logo: 'https:logo',
        url: 'URL',
        datePosted: '2025-01-26T05:00:00Z', // După transformare
        keywords: ['java'],
        source: 'source',
      };

      const favoriteData = { userId: 1, jobId: 1 };
      Job.findOne.mockResolvedValue(null); // Job nu există în baza de date
      Job.create.mockResolvedValue(jobDatabaseData); // Creează job-ul
      Favorite.findOne.mockResolvedValue(null); // Job nu este favorit
      Favorite.create.mockResolvedValue(favoriteData); // Adaugă la favorite

      const response = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${token}`)
        .send({ job: jobData });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Job added to favorites');
      expect(Job.create).toHaveBeenCalledWith(expect.objectContaining(jobDatabaseData));
      expect(Favorite.create).toHaveBeenCalledWith(favoriteData);
    });

    it('should return 204 if the job is already in favorites', async () => {
        const jobData = {
            id: 1, // ID-ul din API extern
            role: 'Software Engineer',
            text: 'Develop and maintain software',
            company_name: 'TechCorp',
            location: 'Remote',
            salary: null,
            employment_type: 'Contract',
            remote: true,
            logo: 'https:logo',
            url: 'URL',
            date_posted: "2025-01-26T05:00:00Z",
            keywords: ['java'],
            source: 'source',
          };
      Favorite.findOne.mockResolvedValue(true); // Job este deja favorit

      const response = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${token}`)
        .send({ job: jobData });

      expect(response.status).toBe(204);
      expect(Favorite.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/favorites', () => {
    it('should return a list of favorite jobs', async () => {
      const favoriteJobs = [
        {
            id: 1, // ID-ul din API extern
            title: 'Software Engineer', // După transformare
            description: 'Develop and maintain software', // După transformare
            company: 'TechCorp', // După transformare
            location: 'Remote',
            salary: null,
            employmentType: 'Contract', // După transformare
            remote: true,
            logo: 'https:logo',
            url: 'URL',
            datePosted: '2025-01-26T05:00:00Z', // După transformare
            keywords: ['java'],
            source: 'source',
          },
      ];

      Favorite.findAll.mockResolvedValue(
        favoriteJobs.map((job) => ({ job }))
      ); // Returnează joburile favorite

      const response = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(favoriteJobs);
      expect(Favorite.findAll).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: { model: Job, as: 'job' },
      });
    });
  });

  describe('DELETE /api/favorites/:jobId', () => {
    it('should delete a favorite job', async () => {
      const jobId = "1";

      Favorite.findOne.mockResolvedValue({ destroy: jest.fn() }); // Găsește jobul favorit

      const response = await request(app)
        .delete(`/api/favorites/${jobId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Job removed from favorites');
      expect(Favorite.findOne).toHaveBeenCalledWith({ where: { userId: 1, jobId } });
    });

    it('should return 404 if the job is not in favorites', async () => {
      const jobId = 1;

      Favorite.findOne.mockResolvedValue(null); // Jobul favorit nu există

      const response = await request(app)
        .delete(`/api/favorites/${jobId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Job not found in favorites');
    });
  });
});
