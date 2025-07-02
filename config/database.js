const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  // Initialiser la base de données
  async init() {
    if (this.isInitialized) {
      console.log('Base de données déjà initialisée');
      return;
    }

    const dbPath = path.join(__dirname, '..', 'database.sqlite');
    console.log('Connexion à la base de données:', dbPath);

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, async (err) => {
        if (err) {
          console.error('Erreur connexion base de données:', err.message);
          reject(err);
          return;
        }
        
        console.log(' Connexion base de données établie');
        
        try {
          //  Utiliser le système de migrations au lieu de createTables()
          const migrationManager = require('./migrations');
          await migrationManager.runPendingMigrations();
          this.isInitialized = true;
          resolve();
        } catch (error) {
          console.error('Erreur exécution migrations:', error);
          reject(error);
        }
      });
    });
  }

  // Obtenir l'instance de la base de données
  getDB() {
    if (!this.db) {
      throw new Error('Base de données non initialisée. Appelez d\'abord init()');
    }
    return this.db;
  }

  // Obtenir le statut d'initialisation
  isReady() {
    return this.isInitialized && this.db !== null;
  }

  // Fermer la connexion
  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Erreur fermeture base de données:', err.message);
          } else {
            console.log(' Connexion base de données fermée');
          }
          this.isInitialized = false;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  

  // Exécuter une requête SQL
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Récupérer une seule ligne
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Récupérer plusieurs lignes
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  

  // Obtenir le nombre d'utilisateurs
  async getUserCount() {
    const result = await this.get('SELECT COUNT(*) as count FROM users');
    return result.count;
  }

  // Obtenir le nombre de favoris
  async getFavoriteCount() {
    const result = await this.get('SELECT COUNT(*) as count FROM favorites');
    return result.count;
  }

  // Obtenir les statistiques de la base
  async getStats() {
    const userCount = await this.getUserCount();
    const favoriteCount = await this.getFavoriteCount();
    
    return {
      users: userCount,
      favorites: favoriteCount,
      lastUpdate: new Date().toISOString()
    };
  }
}

// Créer une instance singleton
const database = new Database();

module.exports = database; 