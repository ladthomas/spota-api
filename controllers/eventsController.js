const Event = require('../models/Event');

class EventsController {
  // Récupérer tous les événements avec filtres
  static async getAllEvents(req, res) {
    try {
      const filters = {
        user_id: req.query.user_id,
        categorie: req.query.categorie,
        source: req.query.source,
        search: req.query.search,
        limit: req.query.limit ? parseInt(req.query.limit) : null
      };

      // Nettoyer les filtres vides
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined || filters[key] === null || filters[key] === '') {
          delete filters[key];
        }
      });

      console.log('🔍 Récupération événements avec filtres:', filters);

      const events = await Event.findAll(filters);

      res.json({
        success: true,
        message: `${events.length} événements récupérés`,
        events,
        count: events.length
      });

    } catch (error) {
      console.error(' Erreur récupération événements:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des événements',
        error: error.message
      });
    }
  }

  // Récupérer un événement par ID
  static async getEventById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID événement invalide'
        });
      }

      console.log('🔍 Recherche événement ID:', id);

      const event = await Event.findById(parseInt(id));

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Événement non trouvé'
        });
      }

      res.json({
        success: true,
        message: 'Événement trouvé',
        event
      });

    } catch (error) {
      console.error('❌ Erreur récupération événement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'événement',
        error: error.message
      });
    }
  }

  // Créer un nouvel événement
  static async createEvent(req, res) {
    try {
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
      } = req.body;

      // Validation des champs obligatoires
      if (!titre || !lieu || !date || !prix) {
        return res.status(400).json({
          success: false,
          message: 'Champs obligatoires manquants (titre, lieu, date, prix)'
        });
      }

      // Récupérer l'ID utilisateur depuis le token JWT
      const user_id = req.user?.id;

      console.log('📅 Création événement par utilisateur:', user_id);

      const eventData = {
        titre,
        lieu,
        date,
        prix,
        categorie: categorie || 'Autre',
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        description,
        image,
        user_id,
        source: 'user'
      };

      const newEvent = await Event.create(eventData);

      res.status(201).json({
        success: true,
        message: 'Événement créé avec succès',
        event: newEvent
      });

    } catch (error) {
      console.error(' Erreur création événement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'événement',
        error: error.message
      });
    }
  }

  // Mettre à jour un événement
  static async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user?.id;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID événement invalide'
        });
      }

      // Vérifier que l'événement existe et appartient à l'utilisateur
      const existingEvent = await Event.findById(parseInt(id));

      if (!existingEvent) {
        return res.status(404).json({
          success: false,
          message: 'Événement non trouvé'
        });
      }

      // Vérifier la propriété (sauf pour les admins)
      if (existingEvent.user_id !== user_id && !req.user?.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Non autorisé à modifier cet événement'
        });
      }

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
      } = req.body;

      const eventData = {
        titre: titre || existingEvent.titre,
        lieu: lieu || existingEvent.lieu,
        date: date || existingEvent.date,
        prix: prix || existingEvent.prix,
        categorie: categorie || existingEvent.categorie,
        latitude: latitude !== undefined ? parseFloat(latitude) : existingEvent.latitude,
        longitude: longitude !== undefined ? parseFloat(longitude) : existingEvent.longitude,
        description: description !== undefined ? description : existingEvent.description,
        image: image !== undefined ? image : existingEvent.image
      };

      console.log(' Mise à jour événement ID:', id);

      const updatedEvent = await Event.update(parseInt(id), eventData);

      res.json({
        success: true,
        message: 'Événement mis à jour avec succès',
        event: updatedEvent
      });

    } catch (error) {
      console.error(' Erreur mise à jour événement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'événement',
        error: error.message
      });
    }
  }

  // Supprimer un événement
  static async deleteEvent(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user?.id;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID événement invalide'
        });
      }

      console.log('🗑️ Suppression événement ID:', id, 'par utilisateur:', user_id);

      // Supprimer avec vérification de propriété
      const result = await Event.delete(parseInt(id), user_id);

      res.json({
        success: true,
        message: 'Événement supprimé avec succès',
        deletedId: result.deletedId
      });

    } catch (error) {
      console.error(' Erreur suppression événement:', error);
      
      if (error.message.includes('non trouvé') || error.message.includes('non autorisé')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de l\'événement',
        error: error.message
      });
    }
  }

  // Récupérer les événements d'un utilisateur
  static async getUserEvents(req, res) {
    try {
      const user_id = req.user?.id;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      console.log('👤 Récupération événements utilisateur:', user_id);

      const events = await Event.findByUserId(user_id);

      res.json({
        success: true,
        message: `${events.length} événements trouvés`,
        events,
        count: events.length
      });

    } catch (error) {
      console.error(' Erreur récupération événements utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des événements utilisateur',
        error: error.message
      });
    }
  }

  // Récupérer les catégories disponibles
  static async getCategories(req, res) {
    try {
      console.log('📂 Récupération catégories');

      const categories = await Event.getCategories();

      // Ajouter des catégories par défaut si la base est vide
      const defaultCategories = ['Musique', 'Art', 'Sport', 'Culture', 'Food', 'Tech', 'Nature', 'Famille', 'Autre'];
      const allCategories = [...new Set([...categories, ...defaultCategories])].sort();

      res.json({
        success: true,
        message: `${allCategories.length} catégories disponibles`,
        categories: allCategories
      });

    } catch (error) {
      console.error(' Erreur récupération catégories:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des catégories',
        error: error.message
      });
    }
  }

  // Synchroniser avec l'API Paris (endpoint admin)
  static async syncParisEvents(req, res) {
    try {
      console.log(' Synchronisation événements Paris...');

      
      res.json({
        success: true,
        message: 'Synchronisation Paris en cours de développement',
        synced: 0
      });

    } catch (error) {
      console.error(' Erreur synchronisation Paris:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la synchronisation',
        error: error.message
      });
    }
  }

  // Rechercher des événements
  static async searchEvents(req, res) {
    try {
      const { q: query, categorie, source, limit } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Requête de recherche trop courte (minimum 2 caractères)'
        });
      }

      const filters = {
        search: query.trim(),
        categorie,
        source,
        limit: limit ? parseInt(limit) : 20
      };

      console.log('🔍 Recherche événements:', filters);

      const events = await Event.findAll(filters);

      res.json({
        success: true,
        message: `${events.length} événements trouvés pour "${query}"`,
        events,
        query,
        count: events.length
      });

    } catch (error) {
      console.error('❌ Erreur recherche événements:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche',
        error: error.message
      });
    }
  }
}

module.exports = EventsController; 