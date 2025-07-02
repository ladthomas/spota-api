#!/usr/bin/env node

/**
 * Script de gestion des migrations
 * Usage: node migrate.js [command]
 * 
 * Commandes disponibles:
 * - status : Afficher l'état des migrations
 * - run : Exécuter les migrations pendantes
 * - rollback [version] : Rollback d'une migration spécifique
 */

const database = require('../config/database');
const migrationManager = require('../config/migrations');

// Fonction pour afficher l'état des migrations
async function showMigrationStatus() {
  try {
    await database.init();
    
    console.log('=== ÉTAT DES MIGRATIONS ===\n');
    
    // Récupérer les migrations exécutées
    const executedMigrations = await database.all(
      'SELECT * FROM migrations ORDER BY version ASC'
    );
    
    console.log('Migrations exécutées:');
    if (executedMigrations.length === 0) {
      console.log('  Aucune migration exécutée');
    } else {
      executedMigrations.forEach(migration => {
        console.log(`  ${migration.version}: ${migration.name} (${migration.executed_at})`);
      });
    }
    
    console.log('\nMigrations disponibles:');
    migrationManager.migrations.forEach(migration => {
      const isExecuted = executedMigrations.some(m => m.version === migration.version);
      const status = isExecuted ? 'EXÉCUTÉE' : 'PENDANTE';
      console.log(`  ${migration.version}: ${migration.name} [${status}]`);
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'affichage des migrations:', error);
  } finally {
    await database.close();
  }
}

// Fonction pour exécuter les migrations
async function runMigrations() {
  try {
    await database.init();
    console.log('=== EXÉCUTION DES MIGRATIONS ===\n');
    
    await migrationManager.runPendingMigrations();
    
    console.log('\nMigrations terminées avec succès');
    
  } catch (error) {
    console.error('Erreur lors de l\'exécution des migrations:', error);
  } finally {
    await database.close();
  }
}

// Fonction pour rollback une migration
async function rollbackMigration(version) {
  if (!version) {
    console.error('Version de migration requise pour le rollback');
    return;
  }
  
  try {
    await database.init();
    console.log(`=== ROLLBACK MIGRATION ${version} ===\n`);
    
    await migrationManager.rollbackMigration(parseInt(version));
    
    console.log(`\nRollback de la migration ${version} terminé avec succès`);
    
  } catch (error) {
    console.error('Erreur lors du rollback:', error);
  } finally {
    await database.close();
  }
}

// Fonction pour créer une nouvelle migration
function createMigration(name) {
  if (!name) {
    console.error('Nom de migration requis');
    return;
  }
  
  const timestamp = Date.now();
  const version = Math.floor(timestamp / 1000); // Version basée sur timestamp
  
  const template = `
// Migration ${version}: ${name}
migrationManager.addMigration(
  ${version},
  '${name}',
  async () => {
    // Code pour appliquer la migration
    console.log('Exécution de la migration: ${name}');
    
    // Exemple:
    // await database.run('ALTER TABLE users ADD COLUMN new_field TEXT');
  },
  async () => {
    // Code pour annuler la migration
    console.log('Rollback de la migration: ${name}');
    
    // Exemple:
    // await database.run('ALTER TABLE users DROP COLUMN new_field');
  }
);
`;
  
  console.log('=== TEMPLATE DE MIGRATION ===\n');
  console.log(`Ajoutez ce code dans config/migrations.js:\n${template}`);
  console.log(`Version suggérée: ${version}`);
}

// Fonction d'aide
function showHelp() {
  console.log(`
=== GESTIONNAIRE DE MIGRATIONS ===

Usage: node migrate.js [command] [options]

Commandes disponibles:
  status                    Afficher l'état des migrations
  run                       Exécuter les migrations pendantes
  rollback <version>        Rollback d'une migration spécifique
  create <name>             Générer le template d'une nouvelle migration
  help                      Afficher cette aide

Exemples:
  node migrate.js status
  node migrate.js run
  node migrate.js rollback 1
  node migrate.js create "Ajout table notifications"
  `);
}

// Programme principal
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  switch (command) {
    case 'status':
      await showMigrationStatus();
      break;
      
    case 'run':
      await runMigrations();
      break;
      
    case 'rollback':
      await rollbackMigration(arg);
      break;
      
    case 'create':
      createMigration(arg);
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
      
    default:
      console.error('Commande inconnue:', command);
      showHelp();
      process.exit(1);
  }
}

// Exécuter le programme
if (require.main === module) {
  main().catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
} 