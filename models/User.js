const bcrypt = require('bcryptjs');
const database = require('../config/database');

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.name = data.name;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Créer un nouvel utilisateur
  static async create({ email, password, name }) {
    try {
      // Hash du mot de passe avec des rounds par défaut
      const saltRounds = 10; // Valeur plus simple et plus rapide
      console.log('Hachage du mot de passe...');
      const hashedPassword = await bcrypt.hash(password, saltRounds);
              console.log('Mot de passe haché');

      const db = database.getDB();
      
      return new Promise((resolve, reject) => {
        const sql = `
          INSERT INTO users (email, password, name)
          VALUES (?, ?, ?)
        `;

        console.log('Insertion en base...', { email, name });
        
        db.run(sql, [email, hashedPassword, name], function(err) {
          if (err) {
            console.error('Erreur insertion:', err);
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
              reject(new Error('Un compte avec cet email existe déjà'));
            } else {
              reject(err);
            }
          } else {
            console.log('Utilisateur inséré, ID:', this.lastID);
            // Récupérer l'utilisateur créé
            User.findById(this.lastID)
              .then(user => {
                console.log('Utilisateur récupéré:', user.email);
                resolve(user);
              })
              .catch(reject);
          }
        });
      });
    } catch (error) {
      console.error('Erreur création utilisateur:', error);
      throw error;
    }
  }

  // Trouver un utilisateur par ID
  static async findById(id) {
    return new Promise((resolve, reject) => {
      const db = database.getDB();
      const sql = 'SELECT * FROM users WHERE id = ?';

      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(new User(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  // Trouver un utilisateur par email
  static async findByEmail(email) {
    return new Promise((resolve, reject) => {
      const db = database.getDB();
      const sql = 'SELECT * FROM users WHERE email = ?';

      db.get(sql, [email], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(new User(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  // Vérifier le mot de passe
  async comparePassword(candidatePassword) {
    try {
      return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
      console.error('Erreur comparaison mot de passe:', error);
      return false;
    }
  }

  // Mettre à jour un utilisateur
  static async update(userId, updateData) {
    try {
      const db = database.getDB();
      
      // Construire la requête SQL dynamiquement selon les champs à mettre à jour
      const fields = [];
      const values = [];
      
      if (updateData.name !== undefined) {
        fields.push('name = ?');
        values.push(updateData.name);
      }
      
      if (updateData.email !== undefined) {
        fields.push('email = ?');
        values.push(updateData.email);
      }
      
      if (fields.length === 0) {
        throw new Error('Aucune donnée à mettre à jour');
      }
      
      // Ajouter updated_at automatiquement
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(userId); // Pour la clause WHERE

      const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

      return new Promise((resolve, reject) => {
        db.run(sql, values, function(err) {
          if (err) {
            console.error('Erreur mise à jour:', err);
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
              reject(new Error('Un compte avec cet email existe déjà'));
            } else {
              reject(err);
            }
          } else if (this.changes === 0) {
            resolve(null); // Aucun utilisateur trouvé
          } else {
            console.log('Utilisateur mis à jour, ID:', userId);
            // Récupérer l'utilisateur mis à jour
            User.findById(userId)
              .then(user => {
                console.log('Utilisateur récupéré après mise à jour:', user.email);
                resolve(user);
              })
              .catch(reject);
          }
        });
      });
    } catch (error) {
      console.error('Erreur update utilisateur:', error);
      throw error;
    }
  }

  // Convertir en objet JSON (sans le mot de passe)
  toJSON() {
    const userObject = { ...this };
    delete userObject.password;
    return userObject;
  }

  // Supprimer un utilisateur
  static async delete(userId) {
    try {
      const db = database.getDB();
      
      return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM users WHERE id = ?';

        db.run(sql, [userId], function(err) {
          if (err) {
            console.error('Erreur suppression utilisateur:', err);
            reject(err);
          } else if (this.changes === 0) {
            console.log('Aucun utilisateur trouvé avec l\'ID:', userId);
            resolve(false); // Aucun utilisateur trouvé
          } else {
            console.log('Utilisateur supprimé avec succès, ID:', userId);
            resolve(true); // Suppression réussie
          }
        });
      });
    } catch (error) {
      console.error('Erreur delete utilisateur:', error);
      throw error;
    }
  }

  // Obtenir tous les utilisateurs (pour debug)
  static async findAll() {
    return new Promise((resolve, reject) => {
      const db = database.getDB();
      const sql = 'SELECT * FROM users ORDER BY created_at DESC';

      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const users = rows.map(row => new User(row));
          resolve(users);
        }
      });
    });
  }
}

module.exports = User; 