const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
let ioInstance = null;

// Middleware de sécurité
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:1102',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-etablissement-code', 'x-etablissement-access-code']
}));

// Limitation de requêtes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});
app.use('/api/', limiter);

// Middleware pour parser le JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging des requêtes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Import des routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const etablissementRoutes = require('./routes/etablissements');
const classeRoutes = require('./routes/classes');
const matiereRoutes = require('./routes/matieres');
const enseignantRoutes = require('./routes/enseignants');
const salleRoutes = require('./routes/salles');
const coursRoutes = require('./routes/cours');
const emploiTempsRoutes = require('./routes/emplois-temps');
const rattrapageRoutes = require('./routes/rattrapages');
const absenceRoutes = require('./routes/absences');
const teacherAbsenceRoutes = require('./routes/teacherAbsences');
const statistiqueRoutes = require('./routes/statistiques');
const notificationRoutes = require('./routes/notifications');
const eleveRoutes = require('./routes/eleves');
const directeurRoutes = require('./routes/directeurs');
const rpRoutes = require('./routes/responsables');
const periodeRoutes = require('./routes/periodes');
const evaluationRoutes = require('./routes/evaluations');
const noteRoutes = require('./routes/notes');
const bulletinRoutes = require('./routes/bulletins');
const ressourceRoutes = require('./routes/ressources');
const seanceVirtuelleRoutes = require('./routes/seancesVirtuelles');
const examenRoutes = require('./routes/examens');
const sessionExamenRoutes = require('./routes/sessionsExamen');
const repartitionRoutes = require('./routes/repartitions');
const subscriptionRoutes = require('./routes/subscriptions');
const invoiceRoutes = require('./routes/invoices');
const pricingRoutes = require('./routes/pricing');
const paymentRoutes = require('./routes/payments');
const accreditationRoutes = require('./routes/accreditationRoutes');
const chatRoutes = require('./routes/chatRoutes');

const { logAccess } = require('./middleware/auth');

// Logging applicatif global (après parsing et avant routes)
app.use((req, res, next) => {
  // on logge tout ; action générique "global"
  return logAccess('global')(req, res, next);
});

// Middleware pour rendre io accessible dans les routes
app.use((req, res, next) => {
  req.io = ioInstance;
  next();
});

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/etablissements', etablissementRoutes);
app.use('/api/classes', classeRoutes);
app.use('/api/matieres', matiereRoutes);
app.use('/api/enseignants', enseignantRoutes);
app.use('/api/salles', salleRoutes);
app.use('/api/cours', coursRoutes);
app.use('/api/emplois-temps', emploiTempsRoutes);
app.use('/api/rattrapages', rattrapageRoutes);
app.use('/api/absences', absenceRoutes);
app.use('/api/teacher/absences', teacherAbsenceRoutes);
app.use('/api/statistiques', statistiqueRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/eleves', eleveRoutes);
app.use('/api/directeurs', directeurRoutes);
app.use('/api/responsables-pedagogiques', rpRoutes);
app.use('/api/periodes', periodeRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/bulletins', bulletinRoutes);
app.use('/api/ressources', ressourceRoutes);
app.use('/api/seances-virtuelles', seanceVirtuelleRoutes);
app.use('/api/examens', examenRoutes);
app.use('/api/sessions-examen', sessionExamenRoutes);
app.use('/api/repartitions', repartitionRoutes);
app.use('/api/accreditations', accreditationRoutes);
app.use('/api/chat', chatRoutes);

// Routes système
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    service: 'EDT Generator API'
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'API EDT Generator - Système de gestion des emplois du temps',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      etablissements: '/api/etablissements',
      classes: '/api/classes',
      matieres: '/api/matieres',
      enseignants: '/api/enseignants',
      salles: '/api/salles',
      cours: '/api/cours',
      emplois_temps: '/api/emplois-temps',
      rattrapages: '/api/rattrapages',
      absences: '/api/absences',
      statistiques: '/api/statistiques',
      notifications: '/api/notifications'
    },
    documentation: '/api/docs'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Backend EDT Generator est en ligne',
    requested_url: req.originalUrl,
    mode: process.env.NODE_ENV
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method,
    available_endpoints: [
      '/api/auth/login',
      '/api/auth/register',
      '/api/health',
      '/api/etablissements',
      '/api/classes',
      '/api/emplois-temps'
    ]
  });
});

// Middleware de gestion d'erreurs global
app.use((error, req, res, next) => {
  console.error('Erreur globale:', error);

  // Erreur de validation Sequelize
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Données invalides',
      details: error.errors.map(err => ({
        champ: err.path,
        message: err.message
      }))
    });
  }

  // Erreur de contrainte unique
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Conflit de données',
      details: 'Une ressource avec ces données existe déjà'
    });
  }

  // Erreur JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token invalide' });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expiré' });
  }

  // Erreur par défaut
  const status = error.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Erreur interne du serveur'
    : error.message;

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error.details
    })
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test de la connexion à la base de données
    const { testConnection } = require('./config/database');
    await testConnection();

    // Configuration Socket.io
    const http = require('http');
    const { Server } = require("socket.io");
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:1102',
        methods: ["GET", "POST"],
        credentials: true
      }
    });
    ioInstance = io;

    io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Rejoindre la room globale de l'utilisateur (pour notifs privées)
      socket.on('join_user_room', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined their personal room`);
      });

      // Rejoindre une conversation spécifique
      socket.on('join_conversation', (conversationId) => {
        socket.join(`conversation_${conversationId}`);
        console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
      });

      // Quitter une conversation
      socket.on('leave_conversation', (conversationId) => {
        socket.leave(`conversation_${conversationId}`);
      });

      // Typing indicators
      socket.on('typing', (data) => {
        // data: { conversationId, userId, isTyping }
        socket.to(`conversation_${data.conversationId}`).emit('user_typing', data);
      });

      socket.on('disconnect', () => {
        console.log("User Disconnected", socket.id);
      });
    });

    // Synchronisation des modèles désactivée temporairement pour éviter l'erreur de limite d'index MySQL
    const { sequelize } = require('./config/database');
    // await sequelize.sync({ force: false });
    console.log('✅ Base de données prête (sync sautée)');

    // Gestion robuste des erreurs de port
    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.error(`❌ Le port ${PORT} est déjà utilisé.`);
        console.log(`💡 Tentative de libération du port ${PORT}...`);

        const { exec } = require('child_process');
        const command = process.platform === 'win32'
          ? `powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force"`
          : `npx kill-port ${PORT}`;

        exec(command, (err) => {
          if (err) {
            console.error(`❌ Impossible de libérer le port ${PORT}. Fermez le processus manuellement.`);
            process.exit(1);
          } else {
            console.log(`✅ Port ${PORT} libéré. Redémarrage dans 2 secondes...`);
            setTimeout(() => {
              server.listen(PORT, () => {
                console.log(`🚀 Serveur redémarré sur le port ${PORT}`);
              });
            }, 2000);
          }
        });
      } else {
        console.error('❌ Erreur serveur:', e);
      }
    });

    server.listen(PORT, () => {
      console.log('🚀 Serveur EDT Generator démarré avec succès!');
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`📚 API: http://localhost:${PORT}/api`);
      console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
      console.log('\n📋 Endpoints disponibles:');
      console.log('   POST /api/auth/login');
      console.log('   POST /api/auth/register');
      console.log('   GET  /api/etablissements');
      console.log('   GET  /api/classes');
      console.log(`POST /api/emplois-temps/generer`);

      // Démarrer le scheduler de tâches automatisées
      const schedulerService = require('./services/schedulerService');
      schedulerService.start();
    });
  } catch (error) {
    console.error('❌ Erreur démarrage serveur:', error);
    process.exit(1);
  }
};

startServer();