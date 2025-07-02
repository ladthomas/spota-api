/**
 * Utilitaires de validation - Spota Backend
 */

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valide un format d'email
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return emailRegex.test(email.toLowerCase());
}

/**
 * Valide un mot de passe
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return false;
  }
  return password.length >= 6;
}

/**
 * Valide un nom d'utilisateur
 */
function validateName(name) {
  if (!name || typeof name !== 'string') {
    return false;
  }
  return name.trim().length >= 2 && name.trim().length <= 100;
}

/**
 * Nettoie une chaîne de caractères
 */
function sanitizeString(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str.trim().replace(/[<>]/g, '');
}

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  sanitizeString
};
