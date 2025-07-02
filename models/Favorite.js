const db = require('../config/database');

class Favorite {
  // Ajouter un événement aux favoris
  static async add(user_id, event_id) {
    console.log('Ajout favori:', { user_id, event_id });

    const sql = 'INSERT INTO favorites (user_id, event_id) VALUES (?, ?)';

    return new Promise((resolve, reject) => {
      db.run(sql, [user_id, event_id], function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            reject(new Error('Événement déjà en favoris'));
          } else {
            console.error('Erreur ajout favori:', err);
            reject(err);
          }
        } else {
          console.log('Favori ajouté, ID:', this.lastID);
          resolve({
            id: this.lastID,
            user_id,
            event_id,
            created_at: new Date().toISOString()
          });
        }
      });
    });
  }

  // Retirer un événement des favoris
  static async remove(user_id, event_id) {
    console.log(' Suppression favori:', { user_id, event_id });

    const sql = 'DELETE FROM favorites WHERE user_id = ? AND event_id = ?';

    return new Promise((resolve, reject) => {
      db.run(sql, [user_id, event_id], function(err) {
        if (err) {
          console.error('Erreur suppression favori:', err);
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Favori non trouvé'));
        } else {
          console.log('Favori supprimé');
          resolve({ success: true });
        }
      });
    });
  }

  // Récupérer les IDs des favoris d'un utilisateur
  static async getFavoriteIds(user_id) {
    const sql = 'SELECT event_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC';

    return new Promise((resolve, reject) => {
      db.all(sql, [user_id], (err, rows) => {
        if (err) {
          console.error('Erreur récupération IDs favoris:', err);
          reject(err);
        } else {
          const favoriteIds = rows.map(row => row.event_id);
          console.log(`${favoriteIds.length} favoris récupérés pour utilisateur ${user_id}`);
          resolve(favoriteIds);
        }
      });
    });
  }

  // Vérifier si un événement est en favori pour un utilisateur
  static async isFavorite(user_id, event_id) {
    const sql = 'SELECT id FROM favorites WHERE user_id = ? AND event_id = ?';

    return new Promise((resolve, reject) => {
      db.get(sql, [user_id, event_id], (err, row) => {
        if (err) {
          console.error('Erreur vérification favori:', err);
          reject(err);
        } else {
          resolve(!!row);
        }
      });
    });
  }

  // Compter les favoris d'un utilisateur
  static async countByUserId(user_id) {
    const sql = 'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?';

    return new Promise((resolve, reject) => {
      db.get(sql, [user_id], (err, row) => {
        if (err) {
          console.error('Erreur comptage favoris:', err);
          reject(err);
        } else {
          resolve(row.count || 0);
        }
      });
    });
  }

  // Supprimer tous les favoris d'un utilisateur
  static async removeAllByUserId(user_id) {
    const sql = 'DELETE FROM favorites WHERE user_id = ?';

    return new Promise((resolve, reject) => {
      db.run(sql, [user_id], function(err) {
        if (err) {
          console.error('Erreur suppression tous favoris:', err);
          reject(err);
        } else {
          console.log(`${this.changes} favoris supprimés pour utilisateur ${user_id}`);
          resolve({ deleted: this.changes });
        }
      });
    });
  }
}

module.exports = Favorite; 