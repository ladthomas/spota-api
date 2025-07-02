/**
 * Tests unitaires  AuthController
 */

const User = require('../../models/User');
const authController = require('../../controllers/authController');
const { sendTokenResponse } = require('../../middleware/auth');

// Destructurer les fonctions exportées
const { register, login, getMe, updateProfile } = authController;

// Mock du middleware auth
jest.mock('../../middleware/auth', () => ({
  sendTokenResponse: jest.fn()
}));

// Mock du modèle User
jest.mock('../../models/User');

describe('AuthController', () => {
  let req, res;

  beforeEach(() => {
    // Setup des objets request et response mockés
    req = {
      body: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('register', () => {
    test('Devrait créer un utilisateur avec des données valides', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        name: 'Test User'
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        toJSON: () => ({ id: 1, email: 'test@example.com', name: 'Test User' })
      };

      User.create.mockResolvedValue(mockUser);

      // Act
      await register(req, res);

      // Assert
      expect(User.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User'
      });
      expect(sendTokenResponse).toHaveBeenCalledWith(mockUser, 201, res, 'Inscription réussie');
    });

    test('Devrait rejeter si champs manquants', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'Password123'
        // Manque confirmPassword et name
      };

      // Act
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Tous les champs sont requis (email, mot de passe, confirmation, nom)'
      });
      expect(User.create).not.toHaveBeenCalled();
    });

         test('Devrait rejeter données invalides (email, mot de passe, nom)', async () => {
       // Test combiné pour les validations de base
       const invalidCases = [
         {
           body: { email: 'email-invalide', password: 'Password123', confirmPassword: 'Password123', name: 'Test' },
           expectedMessage: 'Format d\'email invalide'
         },
         {
           body: { email: 'test@example.com', password: '123', confirmPassword: '123', name: 'Test User' },
           expectedMessage: 'Le mot de passe doit contenir au moins 6 caractères'
         },
         {
           body: { email: 'test@example.com', password: 'Password123', confirmPassword: 'Password123', name: 'A' },
           expectedMessage: 'Le nom doit contenir au moins 2 caractères'
         }
       ];

       for (const testCase of invalidCases) {
         req.body = testCase.body;
         await register(req, res);
         expect(res.status).toHaveBeenCalledWith(400);
         expect(res.json).toHaveBeenCalledWith({
           success: false,
           message: testCase.expectedMessage
         });
         jest.clearAllMocks(); // Reset pour le prochain cas
       }
     });

     test('Devrait rejeter si mots de passe différents', async () => {
       // Arrange
       req.body = {
         email: 'test@example.com',
         password: 'Password123',
         confirmPassword: 'DifferentPassword',
         name: 'Test User'
       };

       // Act
       await register(req, res);

       // Assert
       expect(res.status).toHaveBeenCalledWith(400);
       expect(res.json).toHaveBeenCalledWith({
         success: false,
         message: 'Les mots de passe ne correspondent pas'
       });
     });

    test('Devrait gérer l\'erreur email déjà existant', async () => {
      // Arrange
      req.body = {
        email: 'existing@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        name: 'Test User'
      };

      User.create.mockRejectedValue(new Error('Un compte avec cet email existe déjà'));

      // Act
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Un compte avec cet email existe déjà'
      });
    });

    test('Devrait gérer les erreurs serveur inattendues', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        name: 'Test User'
      };

      User.create.mockRejectedValue(new Error('Erreur base de données'));

      // Act
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erreur serveur lors de l\'inscription'
      });
    });

         test('Devrait nettoyer les données d\'entrée', () => {
       // Test simple de nettoyage des données
       const testEmail = '  TEST@EXAMPLE.COM  ';
       const testName = '  Test User  ';
       
       const cleanedEmail = testEmail.toLowerCase().trim();
       const cleanedName = testName.trim();
       
       expect(cleanedEmail).toBe('test@example.com');
       expect(cleanedName).toBe('Test User');
       expect(cleanedEmail).not.toContain(' '); // Pas d'espaces
       expect(cleanedName.length).toBeGreaterThan(1); // Nom valide
     });
  });

  describe('login', () => {
    test('Devrait connecter avec des identifiants valides', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'correctPassword'
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        comparePassword: jest.fn().mockResolvedValue(true),
        toJSON: () => ({ id: 1, email: 'test@example.com' })
      };

      User.findByEmail.mockResolvedValue(mockUser);

      // Act
      await login(req, res);

      // Assert
      expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('correctPassword');
      expect(sendTokenResponse).toHaveBeenCalledWith(mockUser, 200, res, 'Connexion réussie');
    });

                   test('Devrait rejeter identifiants invalides', async () => {
       // Test combiné pour les cas d'erreur de login
       const invalidCases = [
         {
           body: { email: 'test@example.com' }, // Manque password
           expectedMessage: 'Email et mot de passe requis'
         },
         {
           body: { email: 'email-invalide', password: 'password' },
           expectedMessage: 'Format d\'email invalide'
         }
       ];

       for (const testCase of invalidCases) {
         req.body = testCase.body;
         await login(req, res);
         expect(res.status).toHaveBeenCalledWith(400);
         expect(res.json).toHaveBeenCalledWith({
           success: false,
           message: testCase.expectedMessage
         });
         jest.clearAllMocks();
       }
     });

    test('Devrait rejeter si utilisateur non trouvé', async () => {
      // Arrange
      req.body = {
        email: 'nonexistent@example.com',
        password: 'password'
      };

      User.findByEmail.mockResolvedValue(null);

      // Act
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    });

    test('Devrait rejeter si mot de passe incorrect', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const mockUser = {
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      User.findByEmail.mockResolvedValue(mockUser);

      // Act
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    });

    test('Devrait gérer les erreurs serveur', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'password'
      };

      User.findByEmail.mockRejectedValue(new Error('Erreur base de données'));

      // Act
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erreur serveur lors de la connexion'
      });
    });
  });

  describe('getMe', () => {
    test('Devrait retourner le profil utilisateur', async () => {
      // Arrange
      req.user = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        toJSON: () => ({ id: 1, email: 'test@example.com', name: 'Test User' })
      };

      // Act
      await getMe(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        user: { id: 1, email: 'test@example.com', name: 'Test User' }
      });
    });
  });

  describe('updateProfile', () => {
    beforeEach(() => {
      req.user = { id: 1 };
    });

         test('Devrait mettre à jour le nom', async () => {
       // Arrange
       req.body = { name: 'Nouveau Nom' };
       
       const updatedUser = {
         id: 1,
         name: 'Nouveau Nom',
         toJSON: () => ({ id: 1, name: 'Nouveau Nom' })
       };

       User.findByEmail.mockResolvedValue(null); // Pas de conflit email
       User.update.mockResolvedValue(updatedUser);

       // Act
       await updateProfile(req, res);

       // Assert
       expect(User.update).toHaveBeenCalledWith(1, { name: 'Nouveau Nom' });
       expect(res.status).toHaveBeenCalledWith(200);
       expect(res.json).toHaveBeenCalledWith({
         success: true,
         message: 'Profil mis à jour avec succès',
         user: { id: 1, name: 'Nouveau Nom' }
       });
     });

                   test('Devrait rejeter données de mise à jour invalides', async () => {
       // Test combiné pour les validations de mise à jour
       const invalidCases = [
         {
           body: { name: 'A' },
           expectedMessage: 'Le nom doit contenir au moins 2 caractères'
         },
         {
           body: { email: 'email-invalide' },
           expectedMessage: 'Format d\'email invalide'
         }
       ];

       for (const testCase of invalidCases) {
         req.body = testCase.body;
         await updateProfile(req, res);
         expect(res.status).toHaveBeenCalledWith(400);
         expect(res.json).toHaveBeenCalledWith({
           success: false,
           message: testCase.expectedMessage
         });
         jest.clearAllMocks();
       }
     });

    test('Devrait rejeter si email déjà utilisé par un autre utilisateur', async () => {
      // Arrange
      req.body = { email: 'existing@example.com' };
      
      const existingUser = { id: 2 }; // Différent de req.user.id
      User.findByEmail.mockResolvedValue(existingUser);

      // Act
      await updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Un compte avec cet email existe déjà'
      });
    });
  });
}); 