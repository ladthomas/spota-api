require('dotenv').config();

const testAuthAPI = async () => {
  const fetch = (await import('node-fetch')).default;
  const API_BASE = 'http://localhost:3001/api';

  console.log(' TEST DE L\'API D\'AUTHENTIFICATION SPOTA\n');

  try {
    // Test 1: Vérifier que le serveur fonctionne
    console.log(' Test 1: Vérification du serveur...');
    const healthResponse = await fetch('http://localhost:3001/health');
    const healthData = await healthResponse.json();
    console.log('Serveur:', healthData.message);
    console.log();

    // Test 2: Inscription
    console.log('Test 2: Inscription d\'un nouvel utilisateur...');
    const registerData = {
      name: 'Thomas Test',
      email: 'thomas.test@spota.fr',
      password: 'motdepasse123',
      confirmPassword: 'motdepasse123'
    };

    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });

    const registerResult = await registerResponse.json();
    
    if (registerResult.success) {
      console.log(' Inscription réussie');
      console.log(' Utilisateur:', registerResult.user.name, `(${registerResult.user.email})`);
      console.log(' Token reçu:', registerResult.token ? 'Oui' : 'Non');
    } else {
      console.log(' Inscription échouée:', registerResult.message);
    }
    console.log();

    // Test 3: Connexion
    console.log(' Test 3: Connexion avec l\'utilisateur créé...');
    const loginData = {
      email: 'thomas.test@spota.fr',
      password: 'motdepasse123'
    };

    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });

    const loginResult = await loginResponse.json();
    
    if (loginResult.success) {
      console.log(' Connexion réussie');
      console.log('Utilisateur:', loginResult.user.name);
      console.log('Token reçu:', loginResult.token ? 'Oui' : 'Non');
      
      // Test 4: Récupération du profil avec le token
      console.log();
      console.log(' Test 4: Récupération du profil utilisateur...');
      
      const profileResponse = await fetch(`${API_BASE}/auth/me`, {
        headers: { 
          'Authorization': `Bearer ${loginResult.token}`,
          'Content-Type': 'application/json'
        }
      });

      const profileResult = await profileResponse.json();
      
      if (profileResult.success) {
        console.log('Profil récupéré');
        console.log(' Données:', {
          id: profileResult.user.id,
          email: profileResult.user.email,
          name: profileResult.user.name,
          created_at: profileResult.user.created_at
        });
      } else {
        console.log(' Récupération profil échouée:', profileResult.message);
      }
    } else {
      console.log(' Connexion échouée:', loginResult.message);
    }

    console.log();
    console.log(' Tests terminés !');

  } catch (error) {
    console.error(' Erreur durant les tests:', error.message);
    console.log('\n Assurez-vous que le serveur backend est démarré avec: npm run dev');
  }
};

// Démarrer les tests
testAuthAPI(); 