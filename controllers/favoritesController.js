const Favorite = require('../models/Favorite');

class FavoritesController {
  // Récupérer tous les favoris de l'utilisateur connecté
  static async getUserFavorites(req, res) {
    try {
      const user_id = req.user?.id;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      console.log(' Récupération favoris utilisateur:', user_id);

      const favorites = await Favorite.getFavoriteIds(user_id);

      res.json({
        success: true,
        message: `${favorites.length} favoris trouvés`,
        favorites,
        count: favorites.length
      });

    } catch (error) {
      console.error(' Erreur récupération favoris:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des favoris',
        error: error.message
      });
    }
  }

  // Ajouter un événement aux favoris
  static async addFavorite(req, res) {
    try {
      const user_id = req.user?.id;
      const { event_id } = req.body;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      if (!event_id || typeof event_id !== 'string' || event_id.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'ID événement invalide'
        });
      }

      console.log(' Ajout favori:', { user_id, event_id });

      const favorite = await Favorite.add(user_id, event_id.trim());

      res.status(201).json({
        success: true,
        message: 'Événement ajouté aux favoris',
        favorite
      });

    } catch (error) {
      console.error(' Erreur ajout favori:', error);
      
      if (error.message.includes('déjà en favoris')) {
        return res.status(409).json({
          success: false,
          message: 'Cet événement est déjà dans vos favoris'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout aux favoris',
        error: error.message
      });
    }
  }

  // Retirer un événement des favoris
  static async removeFavorite(req, res) {
    try {
      const user_id = req.user?.id;
      const { event_id } = req.params;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      if (!event_id || typeof event_id !== 'string' || event_id.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'ID événement invalide'
        });
      }

      console.log(' Suppression favori:', { user_id, event_id });

      await Favorite.remove(user_id, event_id.trim());

      res.json({
        success: true,
        message: 'Événement retiré des favoris'
      });

    } catch (error) {
      console.error(' Erreur suppression favori:', error);
      
      if (error.message.includes('non trouvé')) {
        return res.status(404).json({
          success: false,
          message: 'Favori non trouvé'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du favori',
        error: error.message
      });
    }
  }

  // Vérifier si un événement est en favori
  static async checkFavorite(req, res) {
    try {
      const user_id = req.user?.id;
      const { event_id } = req.params;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      if (!event_id || typeof event_id !== 'string' || event_id.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'ID événement invalide'
        });
      }

      const isFavorite = await Favorite.isFavorite(user_id, event_id.trim());

      res.json({
        success: true,
        isFavorite,
        event_id: event_id.trim()
      });

    } catch (error) {
      console.error(' Erreur vérification favori:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification du favori',
        error: error.message
      });
    }
  }

  // Récupérer les IDs des favoris (pour optimiser les requêtes frontend)
  static async getFavoriteIds(req, res) {
    try {
      const user_id = req.user?.id;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      const favoriteIds = await Favorite.getFavoriteIds(user_id);

      res.json({
        success: true,
        message: `${favoriteIds.length} favoris trouvés`,
        favoriteIds,
        count: favoriteIds.length
      });

    } catch (error) {
      console.error('Erreur récupération IDs favoris:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des IDs favoris',
        error: error.message
      });
    }
  }

  // Compter les favoris de l'utilisateur
  static async countFavorites(req, res) {
    try {
      const user_id = req.user?.id;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      const count = await Favorite.countByUserId(user_id);

      res.json({
        success: true,
        count
      });

    } catch (error) {
      console.error('Erreur comptage favoris:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du comptage des favoris',
        error: error.message
      });
    }
  }

  // Supprimer tous les favoris de l'utilisateur
  static async removeAllFavorites(req, res) {
    try {
      const user_id = req.user?.id;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      console.log('Suppression tous favoris utilisateur:', user_id);

      const result = await Favorite.removeAllByUserId(user_id);

      res.json({
        success: true,
        message: `${result.deleted} favoris supprimés`,
        deleted: result.deleted
      });

    } catch (error) {
      console.error('Erreur suppression tous favoris:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression des favoris',
        error: error.message
      });
    }
  }
}

module.exports = FavoritesController; 