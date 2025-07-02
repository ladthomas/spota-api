const express = require('express');
const router = express.Router();
const FavoritesController = require('../controllers/favoritesController');
const { protect } = require('../middleware/auth');
const { validateFavorite, validateEventId } = require('../middleware/validation');
const { mutationRateLimit } = require('../middleware/security');

// ROOT ( GET / POST / DELETE)

// GET /api/favorites  Récupérer tous les favoris de l'utilisateur
router.get('/', protect, FavoritesController.getUserFavorites);

// GET /api/favorites/ids  Récupérer les IDs des favoris (optimisation)
router.get('/ids', protect, FavoritesController.getFavoriteIds);

// GET /api/favorites/count  Compter les favoris
router.get('/count', protect, FavoritesController.countFavorites);

// GET /api/favorites/check/:event_id  Vérifier si un événement est en favori
router.get('/check/:event_id', protect, validateEventId, FavoritesController.checkFavorite);

// POST /api/favorites  Ajouter un événement aux favoris
router.post('/', protect, mutationRateLimit, validateFavorite, FavoritesController.addFavorite);

// DELETE /api/favorites/:event_id  Retirer un événement des favoris
router.delete('/:event_id', protect, mutationRateLimit, validateEventId, FavoritesController.removeFavorite);

// DELETE /api/favorites  Supprimer tous les favoris
router.delete('/', protect, mutationRateLimit, FavoritesController.removeAllFavorites);

module.exports = router; 