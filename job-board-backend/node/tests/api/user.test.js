const request = require('supertest');
const app = require('../../app'); 
const sequelize = require('../../src/config/database'); 
const User = require('../../src/models/User'); 
const jwt = require('jsonwebtoken');
const redisClient = require('../../redis');
const bcrypt = require('bcryptjs'); 

describe('User API', () => {
  beforeAll(async () => {
    // Inițializează conexiunea la baza de date
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Închide conexiunea după teste
    await sequelize.close();
    await redisClient.disconnect();
  });

  describe('POST /users/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/users/register')
        .send({ username: 'testuser', password: 'password123' });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
    });

    it('should not register a user with an existing username', async () => {
      await User.create({ username: 'existinguser', password: 'hashedpassword' });

      const response = await request(app)
        .post('/users/register')
        .send({ username: 'existinguser', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Username already taken');
    });
  });

  describe('POST /users/login', () => {
    beforeAll(async () => {
      // Creează un utilizator pentru autentificare
      const hashedPassword = await bcrypt.hash('password123', 10); 
      await User.create({ username: 'loginuser', password: hashedPassword });
    });

    it('should authenticate a user successfully', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({ username: 'loginuser', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBeDefined(); // Tokenul JWT trebuie să fie prezent
    });

    it('should return 409 for invalid credentials', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({ username: 'loginuser', password: 'wrongpassword' });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('GET /users/me', () => {
    let token;

    beforeAll(async () => {
      // Creează un utilizator și generează un token
      const user = await User.create({ username: 'authuser', password: 'hashedpassword' });
      token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    });

    it('should return the authenticated user for a valid token', async () => {
      const response = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.username).toBe('authuser');
    });

    it('should return 401 for an invalid token', async () => {
      const response = await request(app)
        .get('/users/me')
        .set('Authorization', 'Bearer INVALID_TOKEN');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
  });
});
