
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5001/api';

async function testDeleteAccount() {
  console.log(' === TEST DE SUPPRESSION DE COMPTE ET DÉCONNEXION AUTOMATIQUE ===\n');

  try {
    // 1. Créer un utilisateur de test
    console.log('1.  Création d\'un utilisateur de test...');
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: '123456',
        confirmPassword: '123456',
        name: 'Utilisateur Test'
      })
    });

    const registerData = await registerResponse.json();
    
    if (!registerData.success) {
      throw new Error(`Échec de l'inscription: ${registerData.message}`);
    }
    
    console.log(' Utilisateur créé avec succès:', registerData.user.email);
    console.log(' Token reçu:', registerData.token.substring(0, 20) + '...\n');

    const token = registerData.token;
    const userEmail = registerData.user.email;

    // 2. Vérifier que l'utilisateur est bien authentifié
    console.log('2.  Vérification de l\'authentification...');
    const profileResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const profileData = await profileResponse.json();
    
    if (!profileData.success) {
      throw new Error(`Échec de récupération du profil: ${profileData.message}`);
    }
    
    console.log(' Utilisateur authentifié:', profileData.user.email);
    console.log(' Données utilisateur:', JSON.stringify(profileData.user, null, 2), '\n');

    // 3. Supprimer le compte
    console.log('3.  Suppression du compte...');
    const deleteResponse = await fetch(`${API_BASE_URL}/auth/delete-account`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const deleteData = await deleteResponse.json();
    
    if (!deleteData.success) {
      throw new Error(`Échec de la suppression: ${deleteData.message}`);
    }
    
    console.log(' Compte supprimé avec succès:', deleteData.message, '\n');

    // 4. Vérifier que le token est invalidé (l'utilisateur est déconnecté)
    console.log('4. 🔒 Vérification de la déconnexion automatique...');
    const testAuthResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const testAuthData = await testAuthResponse.json();
    
    if (testAuthData.success) {
      console.log(' ERREUR: L\'utilisateur est encore authentifié après suppression !');
      console.log(' Token encore valide, déconnexion non automatique');
      return false;
    } else {
      console.log('Déconnexion automatique confirmée: Token invalidé');
      console.log(' Message d\'erreur attendu:', testAuthData.message, '\n');
    }

    // 5. Vérifier que l'utilisateur n'existe plus en base
    console.log('5. 🗄️ Vérification de la suppression en base de données...');
    const loginAttempt = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        password: '123456'
      })
    });

    const loginData = await loginAttempt.json();
    
    if (loginData.success) {
      console.log(' ERREUR: L\'utilisateur existe encore en base après suppression !');
      return false;
    } else {
      console.log(' Utilisateur supprimé de la base de données');
      console.log('Message d\'erreur attendu:', loginData.message, '\n');
    }

    console.log(' === TOUS LES TESTS RÉUSSIS ===');
    console.log('Suppression de compte: OK');
    console.log(' Déconnexion automatique: OK'); 
    console.log(' Nettoyage base de données: OK');
    
    return true;

  } catch (error) {
    console.error('ERREUR LORS DU TEST:', error.message);
    return false;
  }
}

// Exécuter le test
if (require.main === module) {
  testDeleteAccount()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { testDeleteAccount }; 