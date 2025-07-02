/**
 * Tests unitaires  Auth Middleware

 */

const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { protect, generateToken, sendTokenResponse } = require('../../middleware/auth');

// Mocks
jest.mock('jsonwebtoken');
jest.mock('../../models/User');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('generateToken', () => {
    test('Devrait générer un token JWT valide', () => {
      // Arrange
      const userId = 1;
      jwt.sign.mockReturnValue('mocked-jwt-token');

      // Act
      const token = generateToken(userId);

      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      expect(token).toBe('mocked-jwt-token');
    });
  });

  describe('protect middleware', () => {
    test('Devrait autoriser avec token valide', async () => {
      // Arrange
      req.headers.authorization = 'Bearer valid-token';
      
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      };

      jwt.verify.mockReturnValue({ id: 1 });
      User.findById.mockResolvedValue(mockUser);

      // Act
      await protect(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(User.findById).toHaveBeenCalledWith(1);
      expect(req.user).toBe(mockUser);
      expect(next).toHaveBeenCalled();
    });

    test('Devrait rejeter les tokens invalides (manquant, expiré, invalide)', async () => {
      // Test combiné pour tous les cas de rejet de token
      const invalidCases = [
        {
          setup: () => { req.headers.authorization = undefined; },
          expectedMessage: 'Accès non autorisé - Token manquant'
        },
        {
          setup: () => {
            req.headers.authorization = 'Bearer invalid-token';
            const error = new Error('Invalid token');
            error.name = 'JsonWebTokenError';
            jwt.verify.mockImplementation(() => { throw error; });
          },
          expectedMessage: 'Token invalide'
        },
        {
          setup: () => {
            req.headers.authorization = 'Bearer expired-token';
            const error = new Error('Token expired');
            error.name = 'TokenExpiredError';
            jwt.verify.mockImplementation(() => { throw error; });
          },
          expectedMessage: 'Token expiré'
        }
      ];

      for (const testCase of invalidCases) {
        testCase.setup();
        await protect(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: testCase.expectedMessage
        });
        expect(next).not.toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });

    test('Devrait rejeter si utilisateur non trouvé', async () => {
      // Arrange
      req.headers.authorization = 'Bearer valid-token';
      
      jwt.verify.mockReturnValue({ id: 999 });
      User.findById.mockResolvedValue(null);

      // Act
      await protect(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    });

    test('Devrait gérer les erreurs de base de données', async () => {
      // Arrange
      req.headers.authorization = 'Bearer valid-token';
      
      jwt.verify.mockReturnValue({ id: 1 });
      User.findById.mockRejectedValue(new Error('Erreur base de données'));

      // Act
      await protect(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erreur serveur lors de la vérification du token'
      });
    });

    test('Devrait accepter Bearer avec majuscule', async () => {
      // Arrange
      req.headers.authorization = 'Bearer valid-token'; // Format standard
      
      const mockUser = { id: 1 };
      jwt.verify.mockReturnValue({ id: 1 });
      User.findById.mockResolvedValue(mockUser);

      // Act
      await protect(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('sendTokenResponse', () => {
    test('Devrait envoyer une réponse avec token', () => {
      // Arrange
      const mockUser = {
        id: 1,
        toJSON: () => ({ id: 1, email: 'test@example.com' })
      };
      jwt.sign.mockReturnValue('generated-token');

      // Act
      sendTokenResponse(mockUser, 200, res, 'Success message');

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success message',
        token: 'generated-token',
        user: { id: 1, email: 'test@example.com' }
      });
    });

    test('Devrait utiliser message par défaut', () => {
      // Arrange
      const mockUser = {
        id: 1,
        toJSON: () => ({ id: 1 })
      };
      jwt.sign.mockReturnValue('token');

      // Act
      sendTokenResponse(mockUser, 201, res); // Pas de message

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Succès',
        token: 'token',
        user: { id: 1 }
      });
    });
  });
}); 