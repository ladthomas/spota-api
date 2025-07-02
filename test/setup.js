/**
 * Configuration de  tests Jest pour le projet 
 * Spota Backend  Tests Setup
 */

// Mock des variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-very-long-and-secure';
process.env.JWT_EXPIRES_IN = '7d';
process.env.PORT = 5001;

// Mock de la base de données SQLite pour les tests
const mockDatabase = {
  init: jest.fn().mockResolvedValue(true),
  close: jest.fn().mockResolvedValue(true),
  getDB: jest.fn(() => ({
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
    prepare: jest.fn(() => ({
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn(),
      finalize: jest.fn()
    }))
  }))
};

// Mock global de la base de données
jest.mock('../config/database', () => mockDatabase);

// Mock de bcryptjs pour des tests plus rapides
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$10$hashedPassword'),
  compare: jest.fn((password, hash) => {
    // Simule une comparaison réussie pour les mots de passe corrects
    return Promise.resolve(password === 'correctPassword' || hash === '$2a$10$hashedPassword');
  })
}));

// Mock de console.log/error pour des tests plus propres
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// Timeout global pour les tests (réduit pour éviter les timeouts)
jest.setTimeout(5000);

// Nettoyage après chaque test
afterEach(() => {
  jest.clearAllMocks();
});

// Export des mocks pour utilisation dans les tests
module.exports = {
  mockDatabase
};

// Test factice pour éviter l'erreur Jest "must contain at least one test"
if (process.env.NODE_ENV === 'test') {
  describe('Setup Configuration', () => {
    test('Configuration des mocks chargée', () => {
      expect(mockDatabase).toBeDefined();
      expect(process.env.JWT_SECRET).toBe('test-jwt-secret-key-very-long-and-secure');
    });
  });
} 