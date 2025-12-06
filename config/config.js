const path = require('path');
require('dotenv').config();

module.exports = {
  // Configuration de l'application
  app: {
    name: 'EDT Generator API',
    version: '1.0.0',
    port: process.env.PORT || 5000,
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  // Configuration de la base de données
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    name: process.env.DB_NAME || 'edt_generator',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development'
  },

  // Configuration JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'edt_generator_jwt_secret_key_2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: 'EDT Generator API'
  },

  // Configuration sécurité
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_COST) || 12,
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 1000, // 1000 requêtes par fenêtre
    passwordMinLength: 12,
    passwordRegex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  },

  // Configuration emails
  email: {
    enabled: process.env.SMTP_HOST ? true : false,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'noreply@edt-generator.com'
  },

  // Configuration algorithmes
  algorithms: {
    generation: {
      timeout: {
        rapide: 5 * 60 * 1000, // 5 minutes
        equilibre: 15 * 60 * 1000, // 15 minutes
        optimal: 60 * 60 * 1000 // 60 minutes
      },
      maxIterations: {
        rapide: 1000,
        equilibre: 5000,
        optimal: 20000
      }
    }
  },

  // Configuration fichiers
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf', '.xlsx', '.csv'],
    uploadPath: path.join(__dirname, '../uploads')
  },

  // Configuration établissement
  establishment: {
    defaultTimeZone: 'Europe/Paris',
    defaultLanguage: 'fr',
    accessCodeLength: 16,
    academicYearFormat: 'YYYY-YYYY'
  }
};