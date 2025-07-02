/**
 * Tests unitaires  User Model ( crud & validation des donnees )

 */

const User = require('../../models/User');
const bcrypt = require('bcryptjs');

// Mock de la base de données déjà configuré dans setup.js
const { mockDatabase } = require('../setup');

describe('User Model', () => {
  let mockDB;

  beforeEach(() => {
    mockDB = {
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn()
    };
    mockDatabase.getDB.mockReturnValue(mockDB);
  });

  describe('create', () => {
    test('Devrait créer un utilisateur avec succès', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      // Mock de l'insertion réussie
      mockDB.run.mockImplementation((sql, params, callback) => {
        callback.call({ lastID: 1 }, null);
      });

      // Mock de la récupération de l'utilisateur créé
      mockDB.get.mockImplementation((sql, params, callback) => {
        callback(null, {
          id: 1,
          email: 'test@example.com',
          password: '$2a$10$hashedPassword',
          name: 'Test User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });

      // Act
      const user = await User.create(userData);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockDB.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['test@example.com', '$2a$10$hashedPassword', 'Test User'],
        expect.any(Function)
      );
      expect(user).toBeInstanceOf(User);
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
    });

         test('Devrait gérer toutes les erreurs de création', async () => {
       // Test combiné pour toutes les erreurs possibles
       const errorCases = [
         {
           setup: () => {
             const error = new Error('SQLITE_CONSTRAINT_UNIQUE');
             error.code = 'SQLITE_CONSTRAINT_UNIQUE';
             mockDB.run.mockImplementation((sql, params, callback) => {
               callback.call(this, error);
             });
           },
           expectedError: 'Un compte avec cet email existe déjà'
         },
         {
           setup: () => {
             mockDB.run.mockImplementation((sql, params, callback) => {
               callback.call(this, new Error('Erreur base de données'));
             });
           },
           expectedError: 'Erreur base de données'
         }
       ];

       const userData = {
         email: 'test@example.com',
         password: 'password123',
         name: 'Test User'
       };

       for (const errorCase of errorCases) {
         errorCase.setup();
         await expect(User.create(userData)).rejects.toThrow(errorCase.expectedError);
         jest.clearAllMocks();
       }
     });

     test('Devrait gérer l\'erreur de hachage du mot de passe', async () => {
       // Arrange
       const userData = {
         email: 'test@example.com',
         password: 'password123',
         name: 'Test User'
       };

       // Mock d'erreur bcrypt
       bcrypt.hash.mockRejectedValue(new Error('Erreur hachage'));

       // Act & Assert
       await expect(User.create(userData)).rejects.toThrow('Erreur hachage');
     });
  });

  describe('findById', () => {
    test('Devrait trouver un utilisateur par ID', async () => {
      // Arrange
      const userId = 1;
      const mockUserData = {
        id: 1,
        email: 'test@example.com',
        password: '$2a$10$hashedPassword',
        name: 'Test User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockDB.get.mockImplementation((sql, params, callback) => {
        callback(null, mockUserData);
      });

      // Act
      const user = await User.findById(userId);

      // Assert
      expect(mockDB.get).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = ?',
        [userId],
        expect.any(Function)
      );
      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe(1);
      expect(user.email).toBe('test@example.com');
    });

         test('Devrait gérer les cas d\'erreur de findById', async () => {
       // Test combiné pour les erreurs de recherche
       const errorCases = [
         {
           setup: (callback) => mockDB.get.mockImplementation((sql, params, cb) => cb(null, null)),
           test: async () => {
             const user = await User.findById(999);
             expect(user).toBeNull();
           }
         },
         {
           setup: (callback) => mockDB.get.mockImplementation((sql, params, cb) => cb(new Error('Erreur base de données'), null)),
           test: async () => {
             await expect(User.findById(1)).rejects.toThrow('Erreur base de données');
           }
         }
       ];

       for (const errorCase of errorCases) {
         errorCase.setup();
         await errorCase.test();
         jest.clearAllMocks();
       }
     });
  });

  describe('findByEmail', () => {
    test('Devrait trouver un utilisateur par email', async () => {
      // Arrange
      const email = 'test@example.com';
      const mockUserData = {
        id: 1,
        email: 'test@example.com',
        password: '$2a$10$hashedPassword',
        name: 'Test User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockDB.get.mockImplementation((sql, params, callback) => {
        callback(null, mockUserData);
      });

      // Act
      const user = await User.findByEmail(email);

      // Assert
      expect(mockDB.get).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = ?',
        [email],
        expect.any(Function)
      );
      expect(user).toBeInstanceOf(User);
      expect(user.email).toBe('test@example.com');
    });

    
  });

  describe('comparePassword', () => {
    test('Devrait valider un mot de passe correct', async () => {
      // Arrange
      const user = new User({
        id: 1,
        email: 'test@example.com',
        password: '$2a$10$hashedPassword',
        name: 'Test User'
      });

      // Act
      const isValid = await user.comparePassword('correctPassword');

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('correctPassword', '$2a$10$hashedPassword');
      expect(isValid).toBe(true);
    });

                   test('Devrait gérer les mots de passe incorrects et erreurs', async () => {
       // Test combiné pour les cas d'erreur de mot de passe
       const user = new User({
         id: 1,
         email: 'test@example.com',
         password: '$2a$10$hashedPassword',
         name: 'Test User'
       });

       // Cas 1: Mot de passe incorrect
       bcrypt.compare.mockResolvedValue(false);
       const isInvalid = await user.comparePassword('wrongPassword');
       expect(isInvalid).toBe(false);

       // Cas 2: Erreur bcrypt
       bcrypt.compare.mockRejectedValue(new Error('Erreur bcrypt'));
       const isError = await user.comparePassword('password');
       expect(isError).toBe(false);
     });
  });

  describe('update', () => {
    test('Devrait mettre à jour le nom d\'un utilisateur', async () => {
      // Arrange
      const userId = 1;
      const updateData = { name: 'Nouveau Nom' };

      // Mock de mise à jour réussie
      mockDB.run.mockImplementation((sql, params, callback) => {
        callback.call({ changes: 1 }, null);
      });

      // Mock de récupération de l'utilisateur mis à jour
      mockDB.get.mockImplementation((sql, params, callback) => {
        callback(null, {
          id: 1,
          email: 'test@example.com',
          password: '$2a$10$hashedPassword',
          name: 'Nouveau Nom',
          updated_at: new Date().toISOString()
        });
      });

      // Act
      const updatedUser = await User.update(userId, updateData);

      // Assert
      expect(mockDB.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),
        ['Nouveau Nom', userId],
        expect.any(Function)
      );
      expect(updatedUser).toBeInstanceOf(User);
      expect(updatedUser.name).toBe('Nouveau Nom');
    });

         test('Devrait gérer les erreurs de mise à jour', async () => {
       // Test combiné pour les erreurs de mise à jour
       const errorCases = [
         {
           setup: () => {
             mockDB.run.mockImplementation((sql, params, callback) => {
               callback.call({ changes: 0 }, null);
             });
           },
           test: async () => {
             const result = await User.update(999, { name: 'Test' });
             expect(result).toBeNull();
           }
         },
         {
           setup: () => {},
           test: async () => {
             await expect(User.update(1, {})).rejects.toThrow('Aucune donnée à mettre à jour');
           }
         }
       ];

       for (const errorCase of errorCases) {
         errorCase.setup();
         await errorCase.test();
         jest.clearAllMocks();
       }
     });

     test('Devrait gérer l\'erreur email déjà existant', async () => {
       // Arrange
       const userId = 1;
       const updateData = { email: 'existing@example.com' };

       // Mock d'erreur contrainte unique
       mockDB.run.mockImplementation((sql, params, callback) => {
         const error = new Error('SQLITE_CONSTRAINT_UNIQUE');
         error.code = 'SQLITE_CONSTRAINT_UNIQUE';
         callback.call(this, error);
       });

       // Act & Assert
       await expect(User.update(userId, updateData)).rejects.toThrow('Un compte avec cet email existe déjà');
     });
  });

  describe('delete', () => {
    test('Devrait supprimer un utilisateur avec succès', async () => {
      // Arrange
      const userId = 1;

      // Mock de suppression réussie
      mockDB.run.mockImplementation((sql, params, callback) => {
        callback.call({ changes: 1 }, null);
      });

      // Act
      const result = await User.delete(userId);

      // Assert
      expect(mockDB.run).toHaveBeenCalledWith(
        'DELETE FROM users WHERE id = ?',
        [userId],
        expect.any(Function)
      );
      expect(result).toBe(true);
    });

         test('Devrait gérer les erreurs de suppression', async () => {
       // Test combiné pour les erreurs de suppression
       const errorCases = [
         {
           setup: () => mockDB.run.mockImplementation((sql, params, callback) => {
             callback.call({ changes: 0 }, null);
           }),
           test: async () => {
             const result = await User.delete(999);
             expect(result).toBe(false);
           }
         },
         {
           setup: () => mockDB.run.mockImplementation((sql, params, callback) => {
             callback.call(this, new Error('Erreur base de données'));
           }),
           test: async () => {
             await expect(User.delete(1)).rejects.toThrow('Erreur base de données');
           }
         }
       ];

       for (const errorCase of errorCases) {
         errorCase.setup();
         await errorCase.test();
         jest.clearAllMocks();
       }
     });
  });

  describe('toJSON', () => {
    test('Devrait exclure le mot de passe du JSON', () => {
      // Arrange
      const user = new User({
        id: 1,
        email: 'test@example.com',
        password: '$2a$10$hashedPassword',
        name: 'Test User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Act
      const userJSON = user.toJSON();

      // Assert
      expect(userJSON).toEqual({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        created_at: expect.any(String),
        updated_at: expect.any(String)
      });
      expect(userJSON.password).toBeUndefined();
    });
  });
}); 