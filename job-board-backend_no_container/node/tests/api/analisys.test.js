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

jest.mock('../../redis.js', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
}));
jest.mock('axios');

jest.mock('../../src/models/Favorite', () => ({
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
  }));

const request = require('supertest');
const axios = require('axios');
const path = require('path');
const redisClient = require('../../redis.js');
const { calculateCompatibilityScores, calculateKeywordCompatibilityScores } = require('../../src/controllers/analysisController');
const CV = require('../../src/models/CV');
const Favorite = require('../../src/models/Favorite');
const Job = require('../../src/models/Job');

jest.mock('../../redis.js');
jest.mock('axios');
jest.mock('../../src/models/CV');
jest.mock('../../src/models/Favorite');
jest.mock('../../src/models/Job');

let mockRequest, mockResponse, mockNext;

beforeEach(() => {
  jest.clearAllMocks();
  CV.create = jest.fn(); 
  CV.findAll = jest.fn(); 
  CV.findOne = jest.fn(); 
  mockRequest = {
    user: { id: 1 },
    params: {},
    body: {},
    query: {},
  };

  mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  mockNext = jest.fn();
});

describe('calculateCompatibilityScores', () => {
  it('should return scores from cache if available', async () => {
    const cachedScores = JSON.stringify([{ jobId: 1, score: 90 }]);
    redisClient.get.mockResolvedValue(cachedScores);

    await calculateCompatibilityScores(mockRequest, mockResponse, mockNext);

    expect(redisClient.get).toHaveBeenCalledWith('compatibility_scores_user_1');
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({ scores: JSON.parse(cachedScores) });
  });

  it('should return an error if no CVs are found', async () => {
    redisClient.get.mockResolvedValue(null);
    CV.findAll.mockResolvedValue([]);

    await calculateCompatibilityScores(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Nu există niciun CV asociat acestui utilizator.' });
  });

  it('should call Flask API and cache the results if not in cache', async () => {
    redisClient.get.mockResolvedValue(null);
    CV.findAll.mockResolvedValue([{ filePath: '/uploads/test-cv.pdf' }]);
    Favorite.findAll.mockResolvedValue([
      {
        job: { id: 1, title: 'Developer', description: 'Job description', keywords: ['JavaScript'] },
      },
    ]);

    axios.post.mockResolvedValue({ data: { compatibility_scores: [{ jobId: 1, score: 90 }] } });

    await calculateCompatibilityScores(mockRequest, mockResponse, mockNext);

    expect(redisClient.set).toHaveBeenCalledWith(
      'compatibility_scores_user_1',
      JSON.stringify([{ jobId: 1, score: 90 }]),
      { EX: 3600 }
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({ scores: [{ jobId: 1, score: 90 }] });
  });

  it('should handle errors from Flask gracefully', async () => {
    redisClient.get.mockResolvedValue(null);
    CV.findAll.mockResolvedValue([{ filePath: '/uploads/test-cv.pdf' }]);
    Favorite.findAll.mockResolvedValue([
      {
        job: { id: 1, title: 'Developer', description: 'Job description', keywords: ['JavaScript'] },
      },
    ]);

    axios.post.mockRejectedValue(new Error('Flask error'));

    await calculateCompatibilityScores(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'A apărut o problemă la calcularea scorurilor de compatibilitate.' });
  });
});

describe('calculateKeywordCompatibilityScores', () => {
  it('should return scores from cache if available', async () => {
    const cachedScores = JSON.stringify([{ jobId: 1, score: 80 }]);
    redisClient.get.mockResolvedValue(cachedScores);

    await calculateKeywordCompatibilityScores(mockRequest, mockResponse, mockNext);

    expect(redisClient.get).toHaveBeenCalledWith('keyword_compatibility_scores_user_1');
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({ scores: JSON.parse(cachedScores) });
  });

  it('should return an error if no CVs are found', async () => {
    redisClient.get.mockResolvedValue(null);
    CV.findAll.mockResolvedValue([]);

    await calculateKeywordCompatibilityScores(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Nu există niciun CV asociat acestui utilizator.' });
  });

  it('should call Flask API and cache the results if not in cache', async () => {
    redisClient.get.mockResolvedValue(null);
    CV.findAll.mockResolvedValue([{ filePath: '/uploads/test-cv.pdf' }]);
    Favorite.findAll.mockResolvedValue([
      {
        job: { id: 1, title: 'Developer', description: 'Job description', keywords: ['JavaScript'] },
      },
    ]);

    axios.post.mockResolvedValue({ data: { compatibility_scores: [{ jobId: 1, score: 80 }] } });

    await calculateKeywordCompatibilityScores(mockRequest, mockResponse, mockNext);

    expect(redisClient.set).toHaveBeenCalledWith(
      'keyword_compatibility_scores_user_1',
      JSON.stringify([{ jobId: 1, score: 80 }]),
      { EX: 3600 }
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({ scores: [{ jobId: 1, score: 80 }] });
  });

  it('should handle errors from Flask gracefully', async () => {
    redisClient.get.mockResolvedValue(null);
    CV.findAll.mockResolvedValue([{ filePath: '/uploads/test-cv.pdf' }]);
    Favorite.findAll.mockResolvedValue([
      {
        job: { id: 1, title: 'Developer', description: 'Job description', keywords: ['JavaScript'] },
      },
    ]);

    axios.post.mockRejectedValue(new Error('Flask error'));

    await calculateKeywordCompatibilityScores(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'A apărut o problemă la calcularea scorurilor cu cuvinte cheie.' });
  });
});