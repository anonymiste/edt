const rateLimit = require('express-rate-limit');
const { LogConnexion } = require('../database/models');

/**
 * Configuration de base du rate limiting
 */
const baseRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limite chaque IP à 1000 requêtes par fenêtre
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer dans 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    // Journaliser les tentatives de rate limit
    logRateLimitAttempt(req);
    res.status(429).json({
      error: 'Trop de requêtes depuis cette IP, veuillez réessayer dans 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
      retry_after: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Rate limiting strict pour l'authentification
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Seulement 10 tentatives de connexion par fenêtre
  message: {
    error: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Ne pas compter les connexions réussies
  handler: (req, res) => {
    logRateLimitAttempt(req, 'AUTH');
    res.status(429).json({
      error: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retry_after: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Rate limiting pour la génération d'emplois du temps
 */
const generationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5, // Seulement 5 générations par heure
  message: {
    error: 'Trop de générations d\'emplois du temps, veuillez réessayer dans 1 heure.',
    code: 'GENERATION_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logRateLimitAttempt(req, 'GENERATION');
    res.status(429).json({
      error: 'Trop de générations d\'emplois du temps, veuillez réessayer dans 1 heure.',
      code: 'GENERATION_RATE_LIMIT_EXCEEDED',
      retry_after: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Rate limiting pour les imports/exports
 */
const importExportRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20, // 20 imports/exports par heure
  message: {
    error: 'Trop d\'opérations d\'import/export, veuillez réessayer dans 1 heure.',
    code: 'IMPORT_EXPORT_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logRateLimitAttempt(req, 'IMPORT_EXPORT');
    res.status(429).json({
      error: 'Trop d\'opérations d\'import/export, veuillez réessayer dans 1 heure.',
      code: 'IMPORT_EXPORT_RATE_LIMIT_EXCEEDED',
      retry_after: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Rate limiting pour les opérations administratives
 */
const adminRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 100, // 100 opérations admin par heure
  message: {
    error: 'Trop d\'opérations administratives, veuillez réessayer dans 1 heure.',
    code: 'ADMIN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logRateLimitAttempt(req, 'ADMIN');
    res.status(429).json({
      error: 'Trop d\'opérations administratives, veuillez réessayer dans 1 heure.',
      code: 'ADMIN_RATE_LIMIT_EXCEEDED',
      retry_after: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Rate limiting par utilisateur (pour éviter les abus)
 */
const createUserRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req) => {
      return req.utilisateur ? req.utilisateur.id : req.ip;
    },
    message: {
      error: 'Trop de requêtes pour cet utilisateur, veuillez réessayer plus tard.',
      code: 'USER_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logRateLimitAttempt(req, 'USER');
      res.status(429).json({
        error: 'Trop de requêtes pour cet utilisateur, veuillez réessayer plus tard.',
        code: 'USER_RATE_LIMIT_EXCEEDED',
        retry_after: Math.ceil(req.rateLimit.resetTime / 1000)
      });
    }
  });
};

/**
 * Rate limiting dynamique basé sur le rôle
 */
const roleBasedRateLimit = () => {
  return (req, res, next) => {
    let maxRequests = 100;
    let windowMs = 15 * 60 * 1000;

    if (req.utilisateur) {
      switch (req.utilisateur.role) {
        case 'admin':
          maxRequests = 1000;
          windowMs = 15 * 60 * 1000;
          break;
        case 'directeur':
          maxRequests = 500;
          windowMs = 15 * 60 * 1000;
          break;
        case 'responsable_pedagogique':
          maxRequests = 300;
          windowMs = 15 * 60 * 1000;
          break;
        case 'enseignant':
          maxRequests = 200;
          windowMs = 15 * 60 * 1000;
          break;
        case 'etudiant':
        case 'personnel':
          maxRequests = 100;
          windowMs = 15 * 60 * 1000;
          break;
        default:
          maxRequests = 50;
          windowMs = 15 * 60 * 1000;
      }
    }

    const limiter = rateLimit({
      windowMs,
      max: maxRequests,
      keyGenerator: (req) => {
        return req.utilisateur ? req.utilisateur.id : req.ip;
      },
      message: {
        error: 'Trop de requêtes, veuillez réessayer plus tard.',
        code: 'ROLE_RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        logRateLimitAttempt(req, 'ROLE_BASED');
        res.status(429).json({
          error: 'Trop de requêtes, veuillez réessayer plus tard.',
          code: 'ROLE_RATE_LIMIT_EXCEEDED',
          retry_after: Math.ceil(req.rateLimit.resetTime / 1000)
        });
      }
    });

    limiter(req, res, next);
  };
};

/**
 * Whitelist pour certaines IPs (admin, monitoring, etc.)
 */
const whitelist = [
  '127.0.0.1', // localhost
  '::1', // IPv6 localhost
  '192.168.1.1', // Exemple d'IP interne
];

/**
 * Rate limiting avec whitelist
 */
const rateLimitWithWhitelist = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => {
    // Les IPs whitelistées n'ont pas de limite
    if (whitelist.includes(req.ip)) {
      return 0; // 0 = pas de limite
    }
    return 1000; // Limite normale pour les autres
  },
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer dans 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Journalisation des tentatives de rate limit
 */
const logRateLimitAttempt = async (req, type = 'GENERAL') => {
  try {
    await LogConnexion.create({
      utilisateur_id: req.utilisateur?.id || null,
      date_heure: new Date(),
      adresse_ip: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      statut: 'ECHEC',
      mot_de_passe_tente: null,
      pays: null,
      ville: null,
      metadata: {
        type: 'RATE_LIMIT',
        limit_type: type,
        path: req.path,
        method: req.method,
        user_agent: req.get('User-Agent')
      }
    });
  } catch (error) {
    console.error('Erreur journalisation rate limit:', error);
  }
};

/**
 * Middleware de monitoring du rate limiting
 */
const rateLimitMonitor = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (res.statusCode === 429) {
      console.warn(`🚨 Rate limit dépassé - IP: ${req.ip}, Route: ${req.path}, Utilisateur: ${req.utilisateur?.id || 'Anonyme'}`);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Configuration du rate limiting par environnement
 */
const getRateLimitConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const configs = {
    development: {
      windowMs: 15 * 60 * 1000,
      max: 5000 // Limite haute en développement
    },
    test: {
      windowMs: 15 * 60 * 1000,
      max: 10000 // Pas de limite pratique en test
    },
    production: {
      windowMs: 15 * 60 * 1000,
      max: 1000 // Limite stricte en production
    }
  };
  
  return configs[env] || configs.development;
};

/**
 * Rate limiting configurable par environnement
 */
const environmentRateLimit = rateLimit({
  ...getRateLimitConfig(),
  message: {
    error: 'Trop de requêtes, veuillez réessayer dans 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  baseRateLimit,
  authRateLimit,
  generationRateLimit,
  importExportRateLimit,
  adminRateLimit,
  createUserRateLimit,
  roleBasedRateLimit,
  rateLimitWithWhitelist,
  rateLimitMonitor,
  environmentRateLimit
};