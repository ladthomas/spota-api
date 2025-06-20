const db = require('../config/database');

class Event {
  // Créer la table events si elle n'existe pas
  static async createTable() {
    const sql = `
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

    return new Promise((resolve, reject) => {
      db.run(sql, function(err) {
        if (err) {
          console.error('Erreur création table events:', err);
          reject(err);
        } else {
          console.log(' Table events créée/vérifiée');
          resolve(this);
        }
      });
    });
  }

  // Créer un nouvel événement
  static async create(eventData) {
    const {
      titre,
      lieu,
      date,
      prix,
      categorie = 'Autre',
      latitude,
      longitude,
      description,
      image,
      user_id,
      source = 'user',
      external_id
    } = eventData;

    console.log(' Création nouvel événement:', titre);

    const sql = `
      INSERT INTO events (
        titre, lieu, date, prix, categorie, latitude, longitude,
        description, image, user_id, source, external_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      db.run(sql, [
        titre, lieu, date, prix, categorie, latitude, longitude,
        description, image, user_id, source, external_id
      ], function(err) {
        if (err) {
          console.error(' Erreur création événement:', err);
          reject(err);
        } else {
          console.log(' Événement créé, ID:', this.lastID);
          
          // Récupérer l'événement créé
          Event.findById(this.lastID)
            .then(event => resolve(event))
            .catch(reject);
        }
      });
    });
  }

  // Trouver un événement par ID
  static async findById(id) {
    const sql = `
      SELECT e.*, u.name as creator_name, u.email as creator_email
      FROM events e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.id = ?
    `;

    return new Promise((resolve, reject) => {
      db.get(sql, [id], (err, row) => {
        if (err) {
          console.error(' Erreur recherche événement:', err);
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  // Récupérer tous les événements avec filtres
  static async findAll(filters = {}) {
    let sql = `
      SELECT e.*, u.name as creator_name, u.email as creator_email
      FROM events e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Filtrer par utilisateur
    if (filters.user_id) {
      sql += ' AND e.user_id = ?';
      params.push(filters.user_id);
    }

    // Filtrer par catégorie
    if (filters.categorie) {
      sql += ' AND e.categorie = ?';
      params.push(filters.categorie);
    }

    // Filtrer par source (user/paris/external)
    if (filters.source) {
      sql += ' AND e.source = ?';
      params.push(filters.source);
    }

    // Recherche textuelle
    if (filters.search) {
      sql += ' AND (e.titre LIKE ? OR e.lieu LIKE ? OR e.description LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Trier par date
    sql += ' ORDER BY e.created_at DESC';

    // Limite
    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }

    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error(' Erreur récupération événements:', err);
          reject(err);
        } else {
          console.log(` ${rows.length} événements récupérés`);
          resolve(rows || []);
        }
      });
    });
  }

  // Mettre à jour un événement
  static async update(id, eventData) {
    const {
      titre,
      lieu,
      date,
      prix,
      categorie,
      latitude,
      longitude,
      description,
      image
    } = eventData;

    const sql = `
      UPDATE events 
      SET titre = ?, lieu = ?, date = ?, prix = ?, categorie = ?,
          latitude = ?, longitude = ?, description = ?, image = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
      db.run(sql, [
        titre, lieu, date, prix, categorie,
        latitude, longitude, description, image, id
      ], function(err) {
        if (err) {
          console.error(' Erreur mise à jour événement:', err);
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Événement non trouvé'));
        } else {
          console.log(' Événement mis à jour, ID:', id);
          Event.findById(id)
            .then(event => resolve(event))
            .catch(reject);
        }
      });
    });
  }

  // Supprimer un événement
  static async delete(id, user_id = null) {
    let sql = 'DELETE FROM events WHERE id = ?';
    const params = [id];

    // Si user_id fourni, vérifier que l'utilisateur est propriétaire
    if (user_id) {
      sql = 'DELETE FROM events WHERE id = ? AND user_id = ?';
      params.push(user_id);
    }

    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          console.error(' Erreur suppression événement:', err);
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Événement non trouvé ou non autorisé'));
        } else {
          console.log(' Événement supprimé, ID:', id);
          resolve({ success: true, deletedId: id });
        }
      });
    });
  }

  // Récupérer les événements d'un utilisateur
  static async findByUserId(user_id) {
    return Event.findAll({ user_id });
  }

  // Récupérer les catégories disponibles
  static async getCategories() {
    const sql = 'SELECT DISTINCT categorie FROM events WHERE categorie IS NOT NULL ORDER BY categorie';

    return new Promise((resolve, reject) => {
      db.all(sql, [], (err, rows) => {
        if (err) {
          console.error(' Erreur récupération catégories:', err);
          reject(err);
        } else {
          const categories = rows.map(row => row.categorie);
          resolve(categories);
        }
      });
    });
  }

  // Sauvegarder des événements externes (API Paris)
  static async saveExternalEvents(events, source = 'paris') {
    console.log(` Sauvegarde ${events.length} événements ${source}...`);
    
    const savedEvents = [];
    
    for (const event of events) {
      try {
        // Vérifier si l'événement existe déjà
        const existing = await Event.findByExternalId(event.id, source);
        
        if (!existing) {
          const savedEvent = await Event.create({
            ...event,
            titre: event.titre,
            source,
            external_id: event.id,
            user_id: null // Événements externes n'ont pas de propriétaire
          });
          savedEvents.push(savedEvent);
        }
      } catch (error) {
        console.error(` Erreur sauvegarde événement ${event.titre}:`, error);
      }
    }
    
    console.log(` ${savedEvents.length} nouveaux événements ${source} sauvegardés`);
    return savedEvents;
  }

  // Trouver par ID externe
  static async findByExternalId(external_id, source) {
    const sql = 'SELECT * FROM events WHERE external_id = ? AND source = ?';

    return new Promise((resolve, reject) => {
      db.get(sql, [external_id, source], (err, row) => {
        if (err) {
          console.error(' Erreur recherche événement externe:', err);
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }
}

module.exports = Event; 