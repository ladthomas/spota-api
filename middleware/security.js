const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Configuration du rate limiting
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requêtes par fenêtre
    message: {
      success: false,
      message: 'Trop de requêtes, veuillez réessayer plus tard.',
      retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Identifier l'utilisateur par IP + User-Agent pour plus de précision
    keyGenerator: (req) => {
      return `${req.ip}-${req.get('User-Agent') || 'unknown'}`;
    },
    // Ignorer les requêtes de santé
    skip: (req) => {
      return req.path === '/health' || req.path === '/api/health';
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
};

// Rate limiting spécifique pour l'authentification (plus strict)
const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives de connexion par IP
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
    retryAfter: 900
  }
});

//  opérations de modification
const mutationRateLimit = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 modifications par minute
  message: {
    success: false,
    message: 'Trop de modifications. Veuillez ralentir.',
    retryAfter: 60
  }
});


const generalRateLimit = createRateLimiter();

// Configuration Helmet pour la sécurité des headers
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Désactivé pour les apps mobiles
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Middleware de protection contre les attaques par force brute
const bruteForceProtection = (req, res, next) => {
  // Compter les tentatives échouées par IP
  const attempts = req.app.locals.loginAttempts || {};
  const clientIP = req.ip;
  
  if (!attempts[clientIP]) {
    attempts[clientIP] = { count: 0, lastAttempt: Date.now() };
  }
  
  const userAttempts = attempts[clientIP];
  const now = Date.now();
  const timeDiff = now - userAttempts.lastAttempt;
  
  // Reset les tentatives après 1 heure
  if (timeDiff > 60 * 60 * 1000) {
    userAttempts.count = 0;
  }
  
  // Bloquer après 10 tentatives échouées
  if (userAttempts.count >= 10) {
    return res.status(429).json({
      success: false,
      message: 'Compte temporairement bloqué en raison de trop nombreuses tentatives échouées.',
      blockedUntil: new Date(userAttempts.lastAttempt + 60 * 60 * 1000).toISOString()
    });
  }
  
  // Middleware pour enregistrer les échecs
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode === 401 && req.path.includes('/login')) {
      userAttempts.count++;
      userAttempts.lastAttempt = now;
    } else if (res.statusCode === 200 && req.path.includes('/login')) {
      // Reset en cas de succès
      userAttempts.count = 0;
    }
    
    req.app.locals.loginAttempts = attempts;
    return originalSend.call(this, data);
  };
  
  next();
};

// Middleware de validation des headers
const validateHeaders = (req, res, next) => {
  // Vérifier la présence des headers requis pour les requêtes POST/PUT
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type application/json requis'
      });
    }
  }
  
  // Vérifier la taille du payload
  const contentLength = req.get('Content-Length');
  const maxSize = parseInt(process.env.MAX_REQUEST_SIZE) || 10 * 1024 * 1024; // 10MB par défaut
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    return res.status(413).json({
      success: false,
      message: 'Payload trop volumineux'
    });
  }
  
  next();
};

// Middleware de protection contre les injections
const sanitizeHeaders = (req, res, next) => {
  // Nettoyer les headers potentiellement dangereux
  const dangerousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-forwarded-proto'];
  
  dangerousHeaders.forEach(header => {
    if (req.headers[header]) {
      req.headers[header] = req.headers[header].toString().replace(/[<>"']/g, '');
    }
  });
  
  next();
};

// Middleware de logging des requêtes suspectes
const logSuspiciousActivity = (req, res, next) => {
  const suspiciousPatterns = [
    /(\<script\>)/i,
    /(union.*select)/i,
    /(drop.*table)/i,
    /(\.\.\/)/, // Path traversal
    /(eval\()/i,
    /(javascript:)/i
  ];
  
  const checkString = `${req.url} ${JSON.stringify(req.body)} ${JSON.stringify(req.query)}`;
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(checkString));
  
  if (isSuspicious) {
    console.warn(' Activité suspecte détectée:', {
      ip: req.ip,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      body: req.body,
      query: req.query,
      timestamp: new Date().toISOString()
    });
    
    // Optionnel : bloquer la requête
    // return res.status(403).json({
    //   success: false,
    //   message: 'Requête bloquée pour activité suspecte'
    // });
  }
  
  next();
};

module.exports = {
  generalRateLimit,
  authRateLimit,
  mutationRateLimit,
  helmetConfig,
  bruteForceProtection,
  validateHeaders,
  sanitizeHeaders,
  logSuspiciousActivity
}; 