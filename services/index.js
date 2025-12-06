// services/index.js
const AuthService = require('./authService');
const GenerationService = require('./generationService');
const NotificationService = require('./notificationService');
const EmailService = require('./emailService');
const CSPAlgorithm = require('./algorithmes/cspAlgorithm');
const GeneticAlgorithm = require('./algorithmes/geneticAlgorithm');
const ConstraintEngine = require('./algorithmes/constraintEngine');

module.exports = {
  AuthService,
  GenerationService,
  NotificationService,
  EmailService,
  CSPAlgorithm,
  GeneticAlgorithm,
  ConstraintEngine
};