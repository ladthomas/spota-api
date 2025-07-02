/**
 * Tests de performance  Load Testing (Simplifiés)
 
 */

const { performance } = require('perf_hooks');
const User = require('../../models/User');

describe('Performance Tests', () => {
  describe('Mock Performance', () => {
    test('⚡ Les mocks devraient être instantanés', () => {
      const start = performance.now();
      
      // Test simple avec mocks
      const mockUser = new User({
        id: 1,
        email: 'perf@test.com',
        password: 'hashedPassword',
        name: 'Performance Test'
      });

      const result = mockUser.toJSON();
      
      const end = performance.now();
      const duration = end - start;

      // Les mocks devraient être très rapides (< 10ms)
      expect(duration).toBeLessThan(10);
      expect(result).toBeDefined();
      expect(result.password).toBeUndefined(); // Vérifie que toJSON exclut le password
    });

    test('⚡ Création multiple d\'objets User mockés', () => {
      const start = performance.now();
      const users = [];

      // Créer 100 objets User mockés
      for (let i = 0; i < 100; i++) {
        const user = new User({
          id: i + 1,
          email: `user${i}@test.com`,
          password: 'hashedPassword',
          name: `User ${i}`
        });
        users.push(user.toJSON());
      }

      const end = performance.now();
      const duration = end - start;

      // Création de 100 objets doit être rapide (< 50ms)
      expect(duration).toBeLessThan(50);
      expect(users).toHaveLength(100);
      expect(users[0].email).toBe('user0@test.com');
    });

    test('📊 Utilisation mémoire stable', () => {
      const initialMemory = process.memoryUsage();
      
      // Opération simple qui ne devrait pas consommer beaucoup de mémoire
      const testData = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        email: `test${i}@example.com`,
        name: `Test ${i}`
      }));

      // Traitement des données
      const processed = testData.map(item => ({
        ...item,
        processed: true
      }));

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // L'augmentation de mémoire devrait être minime (< 1MB)
      expect(memoryIncrease).toBeLessThan(1024 * 1024);
      expect(processed).toHaveLength(50);
    });
  });
}); 