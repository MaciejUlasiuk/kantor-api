const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerUser, loginUser, users } = require('../../controllers/authController'); 
const app = require('../../server'); 
const request = require('supertest');

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

require('dotenv').config();


describe('Auth Controller - Unit Tests', () => {
  beforeEach(() => {
    users.length = 0; 
    jest.clearAllMocks();

    bcrypt.genSalt.mockResolvedValue('randomSalt');
    bcrypt.hash.mockResolvedValue('hashedPassword123');
    bcrypt.compare.mockResolvedValue(true); 
    jwt.sign.mockReturnValue('mocked.jwt.token');
  });

  describe('registerUser - Unit', () => {
    it('should hash the password before saving a new user', async () => {
      const mockReq = {
        body: { email: 'test@example.com', password: 'password123', name: 'Test User' },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await registerUser(mockReq, mockRes);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'randomSalt');
      expect(users[0].password).toBe('hashedPassword123'); 
    });

    
  });

  describe('loginUser - Unit (generateToken part)', () => {
     it('should generate a JWT token on successful login', async () => {
         
         users.push({
             id: 1,
             email: 'login@example.com',
             password: 'hashedPasswordForLogin',
             name: 'Login User',
             balances: {}, transactions: []
         });

         bcrypt.compare.mockResolvedValue(true);

         const mockReq = {
             body: { email: 'login@example.com', password: 'anyPassword' }, 
         };
         const mockRes = {
             status: jest.fn().mockReturnThis(),
             json: jest.fn(),
         };

         await loginUser(mockReq, mockRes);

         expect(jwt.sign).toHaveBeenCalledWith(
             { id: 1, email: 'login@example.com' },
             process.env.JWT_SECRET,
             { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
         );
         expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
             token: 'mocked.jwt.token'
         }));
     });
  });
});


describe('Auth Endpoints - Integration Tests', () => {
  let server;

  beforeAll((done) => {
    done();
  });

  afterAll((done) => {
   
    done(); 
  });

  beforeEach(() => {
    users.length = 0;
    jest.clearAllMocks(); 
    bcrypt.genSalt.mockResolvedValue('randomSalt');
    bcrypt.hash.mockResolvedValue('hashedPasswordIntegration');
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mocked.jwt.token.integration');
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app) 
        .post('/api/auth/register')
        .send({
          email: 'integ@example.com',
          password: 'password123',
          name: 'Integ User',
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message', 'Użytkownik zarejestrowany pomyślnie.');
      expect(res.body.user).toHaveProperty('email', 'integ@example.com');
      expect(users.length).toBe(1);
      expect(users[0].email).toBe('integ@example.com');
    });

    it('should return 409 if email already exists', async () => {
      
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'conflict@example.com', password: 'password123' });

      
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'conflict@example.com', password: 'password123' });
      expect(res.statusCode).toEqual(409);
      expect(res.body).toHaveProperty('message', 'Użytkownik o podanym adresie email już istnieje.');
    });

    it('should return 400 for invalid input (e.g., missing password)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'badinput@example.com' });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Email i hasło są wymagane.');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      
      const salt = await bcrypt.genSalt(10); 
      const hashedPassword = await bcrypt.hash('password123', salt);
      users.push({
        id: 1,
        email: 'logininteg@example.com',
        password: hashedPassword, 
        name: 'Login Integ User',
        balances: { PLN: 1000 },
        transactions: []
      });
    });

    it('should login an existing user and return a JWT token', async () => {
      bcrypt.compare.mockResolvedValue(true); 

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logininteg@example.com',
          password: 'password123',
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Zalogowano pomyślnie.');
      expect(res.body).toHaveProperty('token', 'mocked.jwt.token.integration');
      expect(res.body.user).toHaveProperty('email', 'logininteg@example.com');
    });

    it('should return 401 for incorrect password', async () => {
      bcrypt.compare.mockResolvedValue(false); 

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logininteg@example.com',
          password: 'wrongpassword',
        });
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Nieprawidłowy email lub hasło.');
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Nieprawidłowy email lub hasło.');
    });
  });
});