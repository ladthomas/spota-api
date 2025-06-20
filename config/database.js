const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
  }

  // Connexion à la base de données
  connect() {
    return new Promise((resolve, reject) => {
      const dbPath = process.env.DB_PATH || './database.sqlite';
      
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error(' Erreur connexion SQLite:', err.message);
          reject(err);
        } else {
          console.log(' Connexion SQLite établie');
          this.initTables()
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  }

  // Initialiser les tables
  async initTables() {
    try {
      // Créer la table users
      await this.createUsersTable();
      
      // Créer la table events
      await this.createEventsTable();
      
      // Créer la table favorites
      await this.createFavoritesTable();
      
      console.log('✅ Toutes les tables initialisées');
    } catch (error) {
      console.error('❌ Erreur initialisation tables:', error);
      throw error;
    }
  }

  // Créer la table users
  createUsersTable() {
    return new Promise((resolve, reject) => {
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      this.db.run(createUsersTable, (err) => {
        if (err) {
          console.error(' Erreur création table users:', err.message);
          reject(err);
        } else {
          console.log(' Table users créée/vérifiée');
          resolve();
        }
      });
    });
  }

  // Créer la table events
  createEventsTable() {
    return new Promise((resolve, reject) => {
      const createEventsTable = `
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          titre TEXT NOT NULL,
          lieu TEXT NOT NULL,
          date TEXT NOT NULL,
          prix TEXT NOT NULL,
          categorie TEXT DEFAULT 'Autre',
          latitude REAL,
          longitude REAL,
          description TEXT,
          image TEXT,
          user_id INTEGER,
          source TEXT DEFAULT 'user',
          external_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `;

      this.db.run(createEventsTable, (err) => {
        if (err) {
          console.error(' Erreur création table events:', err.message);
          reject(err);
        } else {
          console.log(' Table events créée/vérifiée');
          resolve();
        }
      });
    });
  }

  // Créer la table favorites
  createFavoritesTable() {
    return new Promise((resolve, reject) => {
      const createFavoritesTable = `
        CREATE TABLE IF NOT EXISTS favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          event_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
          UNIQUE(user_id, event_id)
        )
      `;

      this.db.run(createFavoritesTable, (err) => {
        if (err) {
          console.error(' Erreur création table favorites:', err.message);
          reject(err);
        } else {
          console.log(' Table favorites créée/vérifiée');
          resolve();
        }
      });
    });
  }

 
  getDb() {
    return this.db;
  }

 
  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error(' Erreur fermeture SQLite:', err.message);
          } else {
            console.log(' Connexion SQLite fermée');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}


const database = new Database();

module.exports = database; 