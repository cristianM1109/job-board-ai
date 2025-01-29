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

jest.mock('axios');
jest.mock('../../redis.js', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
}));

jest.mock('../../src/models/Job', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findByPk: jest.fn(),
}));

const CV = require('../../src/models/CV'); // Modelul CV
const request = require('supertest');
const app = require('../../app'); // Aplicația Express
const axios = require('axios');
const redisClient = require('../../redis.js');
const jwt = require('jsonwebtoken');
const Job = require('../../src/models/Job'); // Importăm modelul Job
const JWT_SECRET = process.env.JWT_SECRET;
describe('Job API', () => {

  beforeAll(async () => {
    token = jwt.sign({ id: 1, username: 'testuser' }, JWT_SECRET, { expiresIn: '1h' });
  });

  beforeEach(() => {
    jest.spyOn(redisClient, 'get').mockResolvedValue(null); // Mock doar pentru get
    jest.spyOn(redisClient, 'set').mockResolvedValue('OK'); // Mock doar pentru set
    jest.spyOn(redisClient, 'connect').mockResolvedValue(null); // Mock doar pentru get
    jest.spyOn(redisClient, 'disconnect').mockResolvedValue('OK'); // Mock doar pentru set
    CV.create = jest.fn(); 
    CV.findAll = jest.fn(); 
    CV.findOne = jest.fn(); 
  });

describe('fetchExternalJobs', () => {
  it('should fetch jobs from the cache if available', async () => {
    const mockCacheData = JSON.stringify({ jobs: [{ id: 1, role: 'Developer' }] });
    redisClient.get.mockResolvedValue(mockCacheData);

    const response = await request(app).get('/api/jobs/external-jobs');

    expect(response.status).toBe(200);
    expect(response.body.jobs).toEqual(JSON.parse(mockCacheData).jobs);
    expect(redisClient.get).toHaveBeenCalledWith('external_jobs_page_1_limit_50');
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('should fetch jobs from the API and cache the results if not in cache', async () => {
    redisClient.get.mockResolvedValue(null); // No cache
    const mockAPIResponse = { data: { results: [{ id: 1, role: 'Developer' }], count: 1 } };
    axios.get.mockResolvedValue(mockAPIResponse);

    const response = await request(app).get('/api/jobs/external-jobs');

    expect(response.status).toBe(200);
    expect(response.body.jobs).toEqual([{ id: 1,"location": "Remote", role: 'Developer' }]);
    expect(redisClient.set).toHaveBeenCalledWith(
      'external_jobs_page_1_limit_50',
      JSON.stringify({ count: 1, jobs: [{ id: 1, role: 'Developer', location: "Remote" }] }),
      { EX: 3600 }
    );
  });

  it('should handle API errors gracefully', async () => {
    redisClient.get.mockResolvedValue(null);
    axios.get.mockRejectedValue(new Error('API error'));

    const response = await request(app).get('/api/jobs/external-jobs');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to fetch external jobs');
  });
});


describe('recommendJobs', () => {
  it('should return cached recommendations if available', async () => {
    const mockCacheData = JSON.stringify({ recommendations: [{ id: 1, score: 95 }] });
    redisClient.get.mockResolvedValue(mockCacheData);

    const response = await request(app).get('/api/jobs/recommend-jobs').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.recommendations).toEqual([{ id: 1, score: 95 }]);
    expect(redisClient.get).toHaveBeenCalledWith('recommend_jobs_user_1');
  });

  it('should return recommendations from Flask if not in cache', async () => {
    redisClient.get.mockResolvedValue(null);
    CV.findAll.mockResolvedValue([{ filePath: '/uploads/test-cv.pdf' }]);
    axios.get.mockResolvedValue({ data: { results: [{ id: 1, role: 'Developer' }] } });
    axios.post.mockResolvedValue({ data: { recommendations: [{ id: 1, score: 95 }] } });

    const response = await request(app).get('/api/jobs/recommend-jobs').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.recommendations).toEqual([{ id: 1, score: 95 }]);
    expect(redisClient.set).toHaveBeenCalledWith(
      'recommend_jobs_user_1',
      JSON.stringify({ recommendations: [{ id: 1, score: 95 }] }),
      { EX: 3600 }
    );
  });

  it('should handle errors from Flask gracefully', async () => {
    redisClient.get.mockResolvedValue(null);
    CV.findAll.mockResolvedValue([{ filePath: '/uploads/test-cv.pdf' }]);
    axios.get.mockResolvedValue({ data: { results: [{ id: 1, role: 'Developer' }] } });
    axios.post.mockRejectedValue(new Error('Flask error'));

    const response = await request(app).get('/api/jobs/recommend-jobs').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('A apărut o problemă la generarea recomandărilor de joburi.');
  });
});


describe('analyzeJobCV', () => {
    it('should analyze a job and return recommendations', async () => {
      CV.findAll.mockResolvedValue([{ filePath: '/uploads/test-cv.pdf' }]);
      Job.findByPk.mockResolvedValue({ id: 1, title: 'Developer', description: 'Job description', keywords: ['java'] });
      axios.post.mockResolvedValue({ data: { analysis: { matchScore: 90, missingSkills: ['Node.js'] } } });
  
      const response = await request(app).get('/api/jobs/analyze-job/1').set('Authorization', `Bearer ${token}`);
  
      expect(response.status).toBe(200);
      expect(response.body.analysis.analysis).toEqual({ matchScore: 90, missingSkills: ['Node.js'] });
    });
  
    it('should handle missing jobs gracefully', async () => {
      Job.findByPk.mockResolvedValue(null);
      CV.findAll.mockResolvedValue([{ filePath: '/uploads/test-cv.pdf' }]);
  
      const response = await request(app).get('/api/jobs/analyze-job/1').set('Authorization', `Bearer ${token}`);
  
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Jobul selectat nu a fost găsit.');
    });

    it('should handle missing CV gracefully', async () => {
      Job.findByPk.mockResolvedValue(null);
  
      const response = await request(app).get('/api/jobs/analyze-job/1').set('Authorization', `Bearer ${token}`);
  
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Nu există niciun CV asociat acestui utilizator.');
    });
  
    it('should handle errors from Flask gracefully', async () => {
      CV.findAll.mockResolvedValue([{ filePath: '/uploads/test-cv.pdf' }]);
      Job.findByPk.mockResolvedValue({ id: 1, title: 'Developer', description: 'Job description', keywords: ['java'] });
      axios.post.mockRejectedValue(new Error('Flask error'));
  
      const response = await request(app).get('/api/jobs/analyze-job/1').set('Authorization', `Bearer ${token}`);
  
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('A apărut o problemă la analiza jobului selectat.');
    });
  });


  describe('Job API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await redisClient.disconnect(); // Deconectează redisClient
  });

  describe('fetchExternalJobs', () => {
    it('should fetch jobs from cache if available', async () => {
      const mockCache = JSON.stringify({ jobs: [{ id: 1, role: 'Developer' }] });
      redisClient.get.mockResolvedValue(mockCache);

      const response = await request(app).get('/api/jobs/external-jobs');

      expect(response.status).toBe(200);
      expect(response.body.jobs).toEqual([{ id: 1, role: 'Developer' }]);
    });

    it('should fetch jobs from API if not available in cache', async () => {
      redisClient.get.mockResolvedValue(null);
      const mockAPIResponse = { data: { results: [{ id: 1, role: 'Developer' }] } };
      axios.get.mockResolvedValue(mockAPIResponse);

      const response = await request(app).get('/api/jobs/external-jobs');

      expect(response.status).toBe(200);
      expect(redisClient.set).toHaveBeenCalledWith(
        'external_jobs_page_1_limit_50',
        JSON.stringify({ jobs: [{ id: 1, role: 'Developer',location: "Remote" }] }),
        { EX: 3600 }
      );
    });
  });
});

});