const User = require('../models/User');
const { sendTokenResponse } = require('../middleware/auth');

// Validation email simple
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};


const register = async (req, res) => {
  try {
    const { email, password, confirmPassword, name } = req.body;

    // Validation des champs requis
    if (!email || !password || !confirmPassword || !name) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis (email, mot de passe, confirmation, nom)'
      });
    }

    // Validation de l'email
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    // Validation de la confirmation du mot de passe
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Les mots de passe ne correspondent pas'
      });
    }

    // Validation de la longueur du mot de passe
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Validation du nom
    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Le nom doit contenir au moins 2 caractères'
      });
    }

    // Créer l'utilisateur
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password,
      name: name.trim()
    });

    console.log('Nouvel utilisateur créé:', user.email);

    // Envoyer la réponse avec token
    sendTokenResponse(user, 201, res, 'Inscription réussie');

  } catch (error) {
    console.error(' Erreur inscription:', error);

    if (error.message === 'Un compte avec cet email existe déjà') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription'
    });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des champs requis
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Validation de l'email
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    // Trouver l'utilisateur par email
    const user = await User.findByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    console.log(' Connexion réussie:', user.email);

    // Envoyer la réponse avec token
    sendTokenResponse(user, 200, res, 'Connexion réussie');

  } catch (error) {
    console.error(' Erreur connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion'
    });
  }
};


const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user.toJSON()
    });
  } catch (error) {
    console.error(' Erreur profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du profil'
    });
  }
};


const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    // Validation des données
    const updateData = {};
    
    if (name !== undefined) {
      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Le nom doit contenir au moins 2 caractères'
        });
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Format d\'email invalide'
        });
      }
      updateData.email = email.toLowerCase().trim();
    }

    // Vérifier si l'email existe déjà (si l'email est modifié)
    if (updateData.email) {
      const existingUser = await User.findByEmail(updateData.email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          success: false,
          message: 'Un compte avec cet email existe déjà'
        });
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await User.update(userId, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    console.log(' Profil mis à jour:', updatedUser.email);

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: updatedUser.toJSON()
    });

  } catch (error) {
    console.error(' Erreur mise à jour profil:', error);
    
    if (error.message === 'Un compte avec cet email existe déjà') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du profil'
    });
  }
};


const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    console.log(' Tentative de suppression du compte:', userEmail);

    // Supprimer l'utilisateur de la base de données
    const isDeleted = await User.delete(userId);
    
    if (!isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    console.log('✅ Compte supprimé avec succès:', userEmail);

    res.status(200).json({
      success: true,
      message: 'Compte supprimé avec succès'
    });

  } catch (error) {
    console.error(' Erreur suppression compte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du compte'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  deleteAccount
}; 