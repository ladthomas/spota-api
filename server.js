require('dotenv').config();
const express = require('express');
const cors = require('cors');
const database = require('./config/database');

// Import des routes
const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const favoritesRoutes = require('./routes/favorites');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origin (applications mobiles)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:8081'];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Middleware pour parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Serveur Spota backend actif',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/favorites', favoritesRoutes);

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  console.error(' Erreur serveur:', err);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne'
  });
});

// Fonction de démarrage du serveur
const startServer = async () => {
  try {
    // Connexion à la base de données
    await database.connect();
    
    // Démarrage du serveur
    app.listen(PORT, () => {
     
      console.log(` Port: ${PORT}`);
      console.log(` Environnement: ${process.env.NODE_ENV || 'development'}`);
     
    });
  } catch (error) {
    console.error(' Erreur démarrage serveur:', error);
    process.exit(1);
  }
};


process.on('SIGINT', async () => {
  console.log('');
  await database.close();
  process.exit(0);
});


if (require.main === module) {
  startServer();
}

module.exports = app; 