const jwt = require('jsonwebtoken'); // Import jwt at the top level for test cases
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env' });

// Mock the JWT secret (for test cases to use)
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// Mock the auth middleware functions
jest.mock('../middleware/auth', () => {
  const mockJwt = require('jsonwebtoken'); // Re-import jwt inside the mock factory
  const mockJwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey'; // Re-define JWT_SECRET inside the mock factory

  return {
    authenticateToken: jest.fn((req, res, next) => {
      const authHeader = req.headers['authorization'];
      if (!authHeader) {
        return res.status(401).json({ message: 'Access token required' });
      }
      const token = authHeader.split(' ')[1];
      mockJwt.verify(token, mockJwtSecret, (err, user) => {
        if (err) {
          return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
      });
    }),
    optionalAuth: jest.fn((req, res, next) => {
      const authHeader = req.headers['authorization'];
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        mockJwt.verify(token, mockJwtSecret, (err, user) => {
          if (!err) {
            req.user = user;
          }
        });
      }
      next();
    }),
  };
});


// Mock the database pool for potential future middleware tests that might interact with DB
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    getConnection: jest.fn(() => ({
      query: jest.fn(),
      release: jest.fn(),
    })),
    end: jest.fn(),
  })),
}));

const { authenticateToken, optionalAuth } = require('../middleware/auth');

describe('Auth Middleware', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;

  beforeEach(() => {
    // Reset mocks before each test
    mockRequest = {
      headers: {},
      user: null,
    };
    mockResponse = {
      status: jest.fn(() => mockResponse), // Chainable status
      json: jest.fn(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  // Test authenticateToken
  describe('authenticateToken', () => {
    it('should call next() if token is valid', () => {
      const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '1h' });
      mockRequest.headers.authorization = `Bearer ${token}`;

      authenticateToken(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockRequest.user).toEqual(expect.objectContaining({ id: 1 }));
    });

    it('should return 401 if no authorization header is present', () => {
      authenticateToken(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Access token required' });
    });

    it('should return 403 if token is invalid', () => {
      mockRequest.headers.authorization = 'Bearer invalid.token';

      authenticateToken(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    });

    it('should return 403 if token is expired', () => {
      const expiredToken = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '-1h' }); // Expired token
      mockRequest.headers.authorization = `Bearer ${expiredToken}`;

      authenticateToken(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    });
  });

  // Test optionalAuth
  describe('optionalAuth', () => {
    it('should call next() if no authorization header is present', () => {
      optionalAuth(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeNull();
    });

    it('should call next() and set req.user if token is valid', () => {
      const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '1h' });
      mockRequest.headers.authorization = `Bearer ${token}`;

      optionalAuth(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockRequest.user).toEqual(expect.objectContaining({ id: 1 }));
    });

    it('should call next() and not set req.user if token is invalid', () => {
      mockRequest.headers.authorization = 'Bearer invalid.token';

      optionalAuth(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeNull();
    });

    it('should call next() and not set req.user if token is expired', () => {
      const expiredToken = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '-1h' }); // Expired token
      mockRequest.headers.authorization = `Bearer ${expiredToken}`;

      optionalAuth(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeNull();
    });
  });
});
