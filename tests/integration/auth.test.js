
const request = require('supertest');
const app = require('../../server');
const { testUsers, generateUniqueUser } = require('../fixtures/users');
const database = require('../../config/database');

describe('API Authentication - Tests d\'intégration', () => {
  let server;
  
  beforeAll(async () => {
    // S'assurer que la base de données est connectée
    await database.connect();
  });

  afterAll(async () => {
    // Fermer la connexion à la base de données
    await database.close();
    if (server) {
      server.close();
    }
  });

  describe('GET /health', () => {
    test('devrait retourner le statut du serveur', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Serveur Spota backend actif',
        timestamp: expect.any(String),
        environment: expect.any(String)
      });
    });
  });

  describe('POST /api/auth/register', () => {
    test('devrait inscrire un nouvel utilisateur avec des données valides', async () => {
      const uniqueUser = generateUniqueUser('jest-integration');

      const response = await request(app)
        .post('/api/auth/register')
        .send(uniqueUser)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: expect.any(String),
        token: expect.any(String),
        user: {
          id: expect.any(Number),
          email: uniqueUser.email,
          name: uniqueUser.name,
          created_at: expect.any(String),
          updated_at: expect.any(String)
        }
      });

      expect(response.body.token).toBeTruthy();
    });

    test('devrait rejeter l\'inscription avec un email invalide', async () => {
      const invalidUser = {
        ...testUsers.invalidEmail
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: expect.stringContaining('email')
      });
    });

    test('devrait rejeter l\'inscription avec des mots de passe non correspondants', async () => {
      const userWithMismatch = {
        ...testUsers.passwordMismatch
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userWithMismatch)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Les mots de passe ne correspondent pas'
      });
    });

    test('devrait rejeter l\'inscription avec un email déjà utilisé', async () => {
      const uniqueUser = generateUniqueUser('duplicate-test');

      // Première inscription
      await request(app)
        .post('/api/auth/register')
        .send(uniqueUser)
        .expect(201);

      // Deuxième inscription avec le même email
      const response = await request(app)
        .post('/api/auth/register')
        .send(uniqueUser)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Erreur serveur lors de l\'inscription'
      });
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;
    
    beforeAll(async () => {
      // Créer un utilisateur pour les tests de connexion
      testUser = generateUniqueUser('login-test');
      
      await request(app)
        .post('/api/auth/register')
        .send(testUser);
    });

    test('devrait connecter un utilisateur avec des identifiants valides', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: expect.any(String),
        token: expect.any(String),
        user: {
          id: expect.any(Number),
          email: testUser.email,
          name: testUser.name,
          created_at: expect.any(String),
          updated_at: expect.any(String)
        }
      });
    });

    test('devrait rejeter la connexion avec un email inexistant', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    });

    test('devrait rejeter la connexion avec un mauvais mot de passe', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    });
  });

  describe('Routes protégées', () => {
    let authToken;
    let testUser;

    beforeAll(async () => {
      // Créer et connecter un utilisateur pour les tests des routes protégées
      testUser = generateUniqueUser('protected-routes-test');
      
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      authToken = loginResponse.body.token;
    });

    describe('GET /api/auth/me', () => {
      test('devrait retourner le profil utilisateur avec un token valide', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          user: {
            id: expect.any(Number),
            email: testUser.email,
            name: testUser.name,
            created_at: expect.any(String),
            updated_at: expect.any(String)
          }
        });
      });

      test('devrait rejeter l\'accès sans token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .expect(401);

        expect(response.body).toEqual({
          success: false,
          message: 'Accès non autorisé - Token manquant'
        });
      });

      test('devrait rejeter l\'accès avec un token invalide', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body).toEqual({
          success: false,
          message: expect.any(String)
        });
      });
    });

    describe('DELETE /api/auth/delete-account', () => {
      test('devrait supprimer le compte utilisateur', async () => {
        // Créer un utilisateur spécifique pour ce test
        const userToDelete = generateUniqueUser('delete-test');
        
        const registerResponse = await request(app)
          .post('/api/auth/register')
          .send(userToDelete);

        const deleteToken = registerResponse.body.token;

        const response = await request(app)
          .delete('/api/auth/delete-account')
          .set('Authorization', `Bearer ${deleteToken}`)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: expect.stringContaining('supprimé')
        });

        // Vérifier que l'utilisateur ne peut plus se connecter
        await request(app)
          .post('/api/auth/login')
          .send({
            email: userToDelete.email,
            password: userToDelete.password
          })
          .expect(401);
      });
    });
  });
}); 