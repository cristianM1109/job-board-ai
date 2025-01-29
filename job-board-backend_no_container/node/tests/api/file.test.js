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
const fs = require('fs');
const app = require('../../app'); // Aplicația Express
const CV = require('../../src/models/CV'); // Modelul CV
const sequelize = require('../../src/config/database'); // Configurația bazei de date
const jwt = require('jsonwebtoken');
const redisClient = require('../../redis');
const JWT_SECRET = process.env.JWT_SECRET;
const path = require('path');

// Mock pentru modelul CV și funcțiile `fs`
jest.mock('../../src/models/CV', () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
}));
jest.mock('fs', () => ({
  unlinkSync: jest.fn(),
}));

jest.spyOn(global.Date, 'now').mockImplementation(() => 1737965471854); // O valoare fixă pentru timpul actual
jest.spyOn(Math, 'random').mockImplementation(() => 0.290615869); // O valoare fixă pentru random

describe('CV API', () => {
  let token;

  beforeAll(async () => {
    token = jwt.sign({ id: 1, username: 'testuser' }, JWT_SECRET, { expiresIn: '1h' });
    await sequelize.sync({ force: true });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    CV.create = jest.fn(); 
    CV.findAll = jest.fn(); 
    CV.findOne = jest.fn(); 
    fs.unlinkSync = jest.fn();
  });

  afterAll(async () => {
    await sequelize.close();
    await redisClient.disconnect();
    jest.restoreAllMocks();
  });
  
  const generateMulterFilename = (fieldname, originalname) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(originalname);
    return `${fieldname}-${uniqueSuffix}${ext}`;
  };

  describe('POST /users/upload/upload-cv', () => {
    it('should upload a CV successfully', async () => {
      const fieldname = 'cv';
      const originalname = 'test-cv.pdf';
      const generatedFilename = generateMulterFilename(fieldname, originalname);
      const mockFilePath = `uploads\\${generatedFilename}`;

      const mockFile = {
        originalname,
        path: mockFilePath,
      };
      const mockCV = {
        id: 1,
        fileName: originalname,
        filePath: mockFilePath,
        userId: 1,
      };

      CV.create.mockResolvedValue(mockCV);

      const response = await request(app)
        .post('/users/upload/upload-cv')
        .set('Authorization', `Bearer ${token}`)
        .attach('cv', Buffer.from('test content'), 'test-cv.pdf'); // Simulăm fișierul încărcat

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('CV uploaded successfully');
      expect(response.body.newCV).toEqual(mockCV);
      expect(CV.create).toHaveBeenCalledWith({
        fileName: mockFile.originalname,
        filePath: mockFile.path,
        userId: 1,
      });
    });

    it('should return 400 if no file is uploaded', async () => {
      const response = await request(app)
        .post('/users/upload/upload-cv')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it('should handle server error', async () => {
      CV.create.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/users/upload/upload-cv')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('test content'), 'test-cv.pdf');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /users/upload/cvs', () => {
    it('should return all user CVs', async () => {
      const mockCVs = [
        { id: 1, fileName: 'cv1.pdf', filePath: '/uploads/cv1.pdf', userId: 1 },
        { id: 2, fileName: 'cv2.pdf', filePath: '/uploads/cv2.pdf', userId: 1 },
      ];

      CV.findAll.mockResolvedValue(mockCVs);

      const response = await request(app)
        .get('/users/upload/cvs')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCVs);
      expect(CV.findAll).toHaveBeenCalledWith({ where: { userId: 1 } });
    });

    it('should handle server error', async () => {
      CV.findAll.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/users/upload/cvs')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch CVs');
    });
  });

  describe('DELETE /users/upload/cvs/:cvId', () => {
    it('should delete a CV successfully', async () => {
      const mockCV = {
        id: 1,
        fileName: 'cv1.pdf',
        filePath: '/uploads/cv1.pdf',
        userId: 1,
        destroy: jest.fn(), // Adaugă metoda mock pentru destroy
      };
      CV.findOne.mockResolvedValue(mockCV);

      const response = await request(app)
        .delete('/users/upload/cvs/1')
        .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('CV deleted successfully');
        expect(CV.findOne).toHaveBeenCalledWith({ where: { id: '1', userId: 1 } });
        expect(fs.unlinkSync).toHaveBeenCalledWith(mockCV.filePath);
        expect(mockCV.destroy).toHaveBeenCalled(); // Verifică că destroy a fost apelat
    });

    it('should return 404 if CV is not found', async () => {
      CV.findOne.mockResolvedValue(null);

      const response = await request(app)
        .delete('/users/upload/cvs/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('CV not found');
    });

    it('should handle server error', async () => {
      CV.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/users/upload/cvs/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to delete CV');
    });
  });
});
