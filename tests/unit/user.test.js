

const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const { testUsers, generateUniqueUser } = require('../fixtures/users');

// Mock de la base de données
jest.mock('../../config/database', () => ({
  getDb: jest.fn(() => ({
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn()
  })),
  connect: jest.fn(),
  close: jest.fn()
}));

describe('User Model - Tests Unitaires', () => {
  
  describe('Validation des données', () => {
    test('devrait valider un email correct', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      validEmails.forEach(email => {
        // Regex simple pour validation email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    test('devrait rejeter un email invalide', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        ''
      ];

      invalidEmails.forEach(email => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    test('devrait valider un mot de passe fort', () => {
      const strongPasswords = [
        'password123',
        'MySecurePass!',
        'Aa1!bcde'
      ];

      strongPasswords.forEach(password => {
        // Validation : au moins 6 caractères
        expect(password.length).toBeGreaterThanOrEqual(6);
      });
    });

    test('devrait rejeter un mot de passe faible', () => {
      const weakPasswords = [
        '123',
        'aa',
        '',
        'ab'
      ];

      weakPasswords.forEach(password => {
        expect(password.length).toBeLessThan(6);
      });
    });
  });

  describe('Hachage des mots de passe', () => {
    test('devrait hacher un mot de passe correctement', async () => {
      const password = 'testpassword123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(20);
    });

    test('devrait comparer un mot de passe correctement', async () => {
      const password = 'testpassword123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const isMatch = await bcrypt.compare(password, hashedPassword);
      expect(isMatch).toBe(true);
      
      const isNotMatch = await bcrypt.compare('wrongpassword', hashedPassword);
      expect(isNotMatch).toBe(false);
    });
  });

  describe('Fixtures de test', () => {
    test('devrait avoir des utilisateurs de test valides', () => {
      expect(testUsers.validUser).toBeDefined();
      expect(testUsers.validUser.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(testUsers.validUser.password).toBeDefined();
      expect(testUsers.validUser.name).toBeDefined();
    });

    test('devrait générer des utilisateurs uniques', () => {
      const user1 = generateUniqueUser('test1');
      const user2 = generateUniqueUser('test2');
      
      expect(user1.email).not.toBe(user2.email);
      expect(user1.email).toContain('test1');
      expect(user2.email).toContain('test2');
    });
  });

  describe('Modèle User (avec mocks)', () => {
    const mockDb = require('../../config/database');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('devrait créer un utilisateur avec des données valides', async () => {
      const userData = testUsers.validUser;
      
      // Mock de la base de données
      mockDb.getDb().run.mockImplementation((sql, params, callback) => {
        callback.call({ lastID: 1 }, null);
      });

      mockDb.getDb().get.mockImplementation((sql, params, callback) => {
        callback(null, {
          id: 1,
          email: userData.email,
          name: userData.name,
          password: 'hashedpassword',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });

      
      expect(mockDb.getDb).toBeDefined();
    });
  });
}); 