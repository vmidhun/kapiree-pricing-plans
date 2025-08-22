const request = require('supertest');
const express = require('express');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken'); // Import jwt at the top level

// Load environment variables
dotenv.config({ path: '../.env' });

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // Define JWT_SECRET at the top level

// Mock the database pool
jest.mock('mysql2/promise', () => {
  const mockConnection = {
    query: jest.fn(),
    release: jest.fn(),
  };
  const mockPool = {
    getConnection: jest.fn(() => mockConnection),
    query: jest.fn(), // Add query method directly to the pool mock
    end: jest.fn(),
  };
  return {
    createPool: jest.fn(() => mockPool),
  };
});

// Import the app and routes
const app = express();
app.use(express.json());
const authRoutes = require('../routes/auth'); // This must come AFTER the mock for mysql2/promise
app.use('/api/auth', authRoutes);

// Mock the auth middleware
jest.mock('../middleware/auth', () => {
  const mockJwt = require('jsonwebtoken'); // Re-import jwt inside the mock factory
  const mockJwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey'; // Re-define JWT_SECRET inside the mock factory

  return {
    authenticateToken: jest.fn((req, res, next) => {
      if (req.headers.authorization) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = mockJwt.verify(token, mockJwtSecret);
          req.user = decoded;
        } catch (err) {
          // If token is invalid, proceed without user or send error
        }
      }
      next();
    }),
    optionalAuth: jest.fn((req, res, next) => {
      if (req.headers.authorization) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = mockJwt.verify(token, mockJwtSecret);
          req.user = decoded;
        } catch (err) {
          // Ignore invalid token for optional auth
        }
      }
      next();
    }),
  };
});

let mockedDbPoolInstance; // To hold the instance of the mocked pool

describe('Auth Routes', () => {
  beforeAll(async () => {
    // Get the mocked pool instance
    const mockedMysql = require('mysql2/promise');
    mockedDbPoolInstance = mockedMysql.createPool();
    mockConnection = await mockedDbPoolInstance.getConnection();

    // Mock query method to return specific results for different tests
    mockConnection.query.mockImplementation((sql, params) => {
      // Mock user data for login/profile
      if (sql.includes('SELECT * FROM users WHERE email = ?')) {
        if (params[0] === 'test@example.com') {
          return [[{ id: 1, username: 'TestUser', email: 'test@example.com', password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz0123456789' }]];
        } else {
          return [[]]; // User not found
        }
      }
      // Mock user for registration check
      if (sql.includes('SELECT * FROM users WHERE email = ?') && params[0] === 'existing@example.com') {
        return [[{ id: 2, username: 'ExistingUser', email: 'existing@example.com', password_hash: '...' }]];
      }
      // Mock user for registration insert
      if (sql.includes('INSERT INTO users')) {
        return [{ insertId: 3 }]; // Simulate successful insert
      }
      // Mock user for getting newly registered user
      if (sql.includes('SELECT id, username, email FROM users WHERE email = ?') && params[0] === 'newuser@example.com') {
        return [[{ id: 3, username: 'NewUser', email: 'newuser@example.com' }]];
      }
      // Mock user for profile
      if (sql.includes('SELECT id, username, email FROM users WHERE id = ?') && params[0] === 1) {
        return [[{ id: 1, username: 'TestUser', email: 'test@example.com' }]];
      }
      return [[]]; // Default empty result
    });
    // Mock bcrypt.genSalt and bcrypt.compare
    jest.spyOn(require('bcryptjs'), 'genSalt').mockResolvedValue('mockSalt');
    jest.spyOn(require('bcryptjs'), 'hash').mockResolvedValue('$2a$10$mockHashedPassword');
    jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true); // Default to match
  });

  afterAll(async () => {
    // Clean up mocks
    jest.restoreAllMocks();
    await mockedDbPoolInstance.end(); // Call end on the mocked pool instance
  });

  beforeEach(() => {
    // Reset mocks before each test
    mockConnection.query.mockClear();
    mockConnection.release.mockClear();
    jest.clearAllTimers();
    jest.resetModules(); // Reset modules to ensure fresh imports if needed

    // Re-apply mocks after reset
    jest.spyOn(require('bcryptjs'), 'genSalt').mockResolvedValue('mockSalt');
    jest.spyOn(require('bcryptjs'), 'hash').mockResolvedValue('$2a$10$mockHashedPassword');
    jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true);
  });

  // Test Registration
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        username: 'NewUser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(newUser.email);
      expect(mockConnection.query).toHaveBeenCalledTimes(3); // Check for user existence, insert, get new user
    });

    it('should return 400 if user already exists', async () => {
      const existingUser = {
        username: 'ExistingUser',
        email: 'existing@example.com',
        password: 'password123',
      };

      // Mock query to return existing user
      mockConnection.query.mockImplementationOnce((sql) => {
        if (sql.includes('SELECT * FROM users WHERE email = ?')) {
          return [[{ id: 2, username: 'ExistingUser', email: 'existing@example.com', password_hash: '...' }]];
        }
        return [[]];
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(existingUser);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message', 'User with this email already exists');
      expect(mockConnection.query).toHaveBeenCalledTimes(1); // Only check for user existence
    });

    it('should return 500 on database error during registration', async () => {
      const newUser = {
        username: 'ErrorUser',
        email: 'error@example.com',
        password: 'password123',
      };

      // Mock query to throw an error
      mockConnection.query.mockImplementationOnce((sql) => {
        if (sql.includes('SELECT * FROM users WHERE email = ?')) {
          throw new Error('Database connection failed');
        }
        return [[]];
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('message', 'Server error during registration');
    });
  });

  // Test Login
  describe('POST /api/auth/login', () => {
    it('should login a user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Mock bcrypt.compare to return true (successful match)
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logged in successfully');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginData.email);
      expect(mockConnection.query).toHaveBeenCalledTimes(1); // Check for user existence
      expect(require('bcryptjs').compare).toHaveBeenCalledWith(loginData.password, '$2a$10$abcdefghijklmnopqrstuvwxyz0123456789');
    });

    it('should return 400 if user does not exist', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      // Mock query to return empty array (user not found)
      mockConnection.query.mockImplementationOnce((sql) => {
        if (sql.includes('SELECT * FROM users WHERE email = ?')) {
          return [[]];
        }
        return [[]];
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
      expect(mockConnection.query).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if password does not match', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // Mock bcrypt.compare to return false (password mismatch)
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
      expect(mockConnection.query).toHaveBeenCalledTimes(1);
      expect(require('bcryptjs').compare).toHaveBeenCalledWith(loginData.password, '$2a$10$abcdefghijklmnopqrstuvwxyz0123456789');
    });

    it('should return 500 on database error during login', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Mock query to throw an error
      mockConnection.query.mockImplementationOnce((sql) => {
        if (sql.includes('SELECT * FROM users WHERE email = ?')) {
          throw new Error('Database connection failed');
        }
        return [[]];
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('message', 'Server error during login');
    });
  });

  // Test Profile Route (Protected)
  describe('GET /api/auth/profile', () => {
    it('should return user profile if authenticated', async () => {
      const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '1h' });

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(1);
      expect(response.body.user.email).toBe('test@example.com');
      expect(mockConnection.query).toHaveBeenCalledTimes(1);
      expect(mockConnection.query).toHaveBeenCalledWith('SELECT id, username, email FROM users WHERE id = ?', [1]);
    });

    it('should return 401 if no token is provided', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });

    it('should return 403 if token is invalid', async () => {
      const invalidToken = 'invalid.token.here';

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty('message', 'Invalid or expired token');
    });

    it('should return 404 if user not found for profile', async () => {
      const token = jwt.sign({ id: 999 }, JWT_SECRET, { expiresIn: '1h' }); // Non-existent user ID

      // Mock query to return empty array for user lookup
      mockConnection.query.mockImplementationOnce((sql) => {
        if (sql.includes('SELECT id, username, email FROM users WHERE id = ?')) {
          return [[]];
        }
        return [[]];
      });

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
      expect(mockConnection.query).toHaveBeenCalledTimes(1);
      expect(mockConnection.query).toHaveBeenCalledWith('SELECT id, username, email FROM users WHERE id = ?', [999]);
    });

    it('should return 500 on database error when fetching profile', async () => {
      const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '1h' });

      // Mock query to throw an error
      mockConnection.query.mockImplementationOnce((sql) => {
        if (sql.includes('SELECT id, username, email FROM users WHERE id = ?')) {
          throw new Error('Database connection failed');
        }
        return [[]];
      });

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('message', 'Server error retrieving profile');
    });
  });

  // Test Logout Route
  describe('POST /api/auth/logout', () => {
    it('should return success message for logout', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });
  });

  // Test Refresh Token Route
  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '1h' });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Token refreshed successfully');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(1);
      expect(mockConnection.query).toHaveBeenCalledTimes(1);
      expect(mockConnection.query).toHaveBeenCalledWith('SELECT id, username, email FROM users WHERE id = ?', [1]);
    });

    it('should return 401 if no token is provided for refresh', async () => {
      const response = await request(app)
        .post('/api/auth/refresh');

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });

    it('should return 403 if token is invalid for refresh', async () => {
      const invalidToken = 'invalid.token.here';

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty('message', 'Invalid or expired token');
    });

    it('should return 404 if user not found for token refresh', async () => {
      const token = jwt.sign({ id: 999 }, JWT_SECRET, { expiresIn: '1h' }); // Non-existent user ID

      // Mock query to return empty array for user lookup
      mockConnection.query.mockImplementationOnce((sql) => {
        if (sql.includes('SELECT id, username, email FROM users WHERE id = ?')) {
          return [[]];
        }
        return [[]];
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
      expect(mockConnection.query).toHaveBeenCalledTimes(1);
      expect(mockConnection.query).toHaveBeenCalledWith('SELECT id, username, email FROM users WHERE id = ?', [999]);
    });

    it('should return 500 on database error during token refresh', async () => {
      const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '1h' });

      // Mock query to throw an error
      mockConnection.query.mockImplementationOnce((sql) => {
        if (sql.includes('SELECT id, username, email FROM users WHERE id = ?')) {
          throw new Error('Database connection failed');
        }
        return [[]];
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('message', 'Server error refreshing token');
    });
  });
});
