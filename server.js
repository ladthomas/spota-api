require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const database = require('./config/database');

// Import des routes
const authRoutes = require('./routes/auth');
// const favoritesRoutes = require('./routes/favorites'); // Favoris supprimés

const app = express();
const PORT = process.env.PORT || 5000;


//  Sécurité de base avec Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Désactivé pour les apps mobiles
  crossOriginEmbedderPolicy: false
}));

//  CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser toutes les requêtes sans origin (apps mobiles)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8081',
      'exp://192.168.1.48:8081', // Expo dev
      'http://192.168.1.48:8081'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Origine non autorisée:', origin);
      callback(null, true); // Autoriser quand même en dev
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

//  Parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

//  Rate limiting simple
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);



// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Spota Backend API - Opérationnel',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes API
app.use('/api/auth', authRoutes);
// app.use('/api/favorites', favoritesRoutes); // Favoris supprimés

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} non trouvée`,
    availableRoutes: [
      'GET /health',
      'POST /api/auth/register',
      'POST /api/auth/login', 
      'DELETE /api/auth/delete-account'
    ]
  });
});



app.use((err, req, res, next) => {
  console.error('Erreur serveur:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});



const startServer = async () => {
  try {
    // Initialiser la base de données
    await database.init();
    
    // Démarrer le serveur
    const server = app.listen(PORT, () => {
      // Serveur démarré silencieusement
    });
    
    return server;
  } catch (error) {
    console.error('Erreur démarrage serveur:', error);
    process.exit(1);
  }
};



const gracefulShutdown = async (signal) => {
  try {
    await database.close();
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'arrêt:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Démarrer seulement si exécuté directement
if (require.main === module) {
  startServer();
}

module.exports = app; 