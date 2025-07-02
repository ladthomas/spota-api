const database = require('./database');

/**
 * Système de migrations pour la base de données
 * Permet de gérer les évolutions de schéma de façon contrôlée
 */

class MigrationManager {
  constructor() {
    this.migrations = [];
  }

  // Ajouter une migration
  addMigration(version, name, up, down) {
    this.migrations.push({
      version,
      name,
      up,
      down,
      executed: false
    });
  }

  // Initialiser la table des migrations
  async initMigrationsTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await database.run(sql);
    console.log('Table migrations initialisée');
  }

  // Vérifier si une migration a été exécutée
  async isMigrationExecuted(version) {
    const result = await database.get(
      'SELECT version FROM migrations WHERE version = ?',
      [version]
    );
    return !!result;
  }

  // Marquer une migration comme exécutée
  async markMigrationExecuted(version, name) {
    await database.run(
      'INSERT INTO migrations (version, name) VALUES (?, ?)',
      [version, name]
    );
  }

  // Exécuter les migrations pendantes
  async runPendingMigrations() {
    await this.initMigrationsTable();
    
    console.log('Vérification des migrations...');
    
    // Trier les migrations par version
    this.migrations.sort((a, b) => a.version - b.version);
    
    let executedCount = 0;
    
    for (const migration of this.migrations) {
      const isExecuted = await this.isMigrationExecuted(migration.version);
      
      if (!isExecuted) {
        console.log(`Exécution migration ${migration.version}: ${migration.name}`);
        
        try {
          await migration.up();
          await this.markMigrationExecuted(migration.version, migration.name);
          executedCount++;
          console.log(`Migration ${migration.version} exécutée avec succès`);
        } catch (error) {
          console.error(`Erreur migration ${migration.version}:`, error);
          throw error;
        }
      }
    }
    
    if (executedCount === 0) {
      console.log('Aucune migration à exécuter');
    } else {
      console.log(`${executedCount} migration(s) exécutée(s)`);  
    }
  }

  // Rollback d'une migration (optionnel, pour le développement)
  async rollbackMigration(version) {
    const migration = this.migrations.find(m => m.version === version);
    if (!migration) {
      throw new Error(`Migration ${version} non trouvée`);
    }

    const isExecuted = await this.isMigrationExecuted(version);
    if (!isExecuted) {
      throw new Error(`Migration ${version} n'a pas été exécutée`);
    }

    console.log(`Rollback migration ${version}: ${migration.name}`);
    
    try {
      await migration.down();
      await database.run('DELETE FROM migrations WHERE version = ?', [version]);
      console.log(`Rollback migration ${version} réussi`);
    } catch (error) {
      console.error(`Erreur rollback migration ${version}:`, error);
      throw error;
    }
  }
}

// Créer le gestionnaire de migrations
const migrationManager = new MigrationManager();



// Migration 001: Création des tables de base
migrationManager.addMigration(
  1,
  'Création tables users et favorites',
  async () => {
    // Créer table users
    await database.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table favorites supprimée - fonctionnalité non utilisée
  },
  async () => {
    // Rollback: supprimer les tables
    await database.run('DROP TABLE IF EXISTS users');
  }
);

// Exemple de migration future (commentée)
/*
migrationManager.addMigration(
  2,
  'Ajout champ avatar aux users',
  async () => {
    await database.run('ALTER TABLE users ADD COLUMN avatar_url TEXT');
  },
  async () => {
    // Note: SQLite ne supporte pas DROP COLUMN, il faudrait recréer la table
    console.log('Rollback non supporté pour cette migration');
  }
);
*/

module.exports = migrationManager; 