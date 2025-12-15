const { body, param, query, validationResult } = require('express-validator');
const {
  RoleUtilisateur,
  TypeEtablissement,
  StatutClasse,
  CategorieMatiere,
  TypeCours,
  StatutProfessionnel,
  TypeSalle,
  StatutSalle,
  JourSemaine,
  StatutEmploiTemps,
  TypeRattrapage,
  StatutRattrapage,
  StatutAbsence,
  TypeDisponibilite,
  TypeNotification,
  TypeContrainte,
  CanalNotification,
  PrioriteNotification,
  TypeOperation,
  CategorieContrainte,
  PrioriteContrainte,
  ModeGeneration,
  FormatExport,
  StatutEtablissement,
  PreferenceHoraire
} = require('../utils/enums');

/**
 * Middleware de gestion des erreurs de validation
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      champ: error.path,
      message: error.msg,
      valeur: error.value
    }));

    return res.status(400).json({
      error: 'Données invalides',
      details: formattedErrors,
      code: 'VALIDATION_ERROR'
    });
  }

  next();
};

/**
 * Fonctions de validation génériques pour les body
 */
const bodyValidation = {
  integer: {
    required: (field) => body(field).exists().withMessage(`${field} est requis`).isInt().withMessage(`${field} doit être un nombre entier`),
    optional: (field) => body(field).optional().isInt().withMessage(`${field} doit être un nombre entier`)
  },
  string: {
    required: (field) => body(field).exists().withMessage(`${field} est requis`).isString().withMessage(`${field} doit être une chaîne de caractères`).trim(),
    optional: (field) => body(field).optional().isString().withMessage(`${field} doit être une chaîne de caractères`).trim()
  },
  boolean: {
    required: (field) => body(field).exists().withMessage(`${field} est requis`).isBoolean().withMessage(`${field} doit être un booléen`),
    optional: (field) => body(field).optional().isBoolean().withMessage(`${field} doit être un booléen`)
  },
  email: {
    required: (field) => body(field).exists().withMessage(`${field} est requis`).isEmail().normalizeEmail().withMessage(`${field} doit être un email valide`),
    optional: (field) => body(field).optional().isEmail().normalizeEmail().withMessage(`${field} doit être un email valide`)
  },
  url: {
    required: (field) => body(field).exists().withMessage(`${field} est requis`).isURL().withMessage(`${field} doit être une URL valide`),
    optional: (field) => body(field).optional().isURL().withMessage(`${field} doit être une URL valide`)
  },
  date: {
    required: (field) => body(field).exists().withMessage(`${field} est requis`).isISO8601().withMessage(`${field} doit être une date valide`),
    optional: (field) => body(field).optional().isISO8601().withMessage(`${field} doit être une date valide`)
  },
  uuid: {
    required: (field) => body(field).exists().withMessage(`${field} est requis`).isUUID().withMessage(`${field} doit être un UUID valide`),
    optional: (field) => body(field).optional().isUUID().withMessage(`${field} doit être un UUID valide`)
  },
  enum: (values) => ({
    required: (field) => body(field).exists().withMessage(`${field} est requis`).isIn(values).withMessage(`${field} doit être l'une des valeurs suivantes: ${values.join(', ')}`),
    optional: (field) => body(field).optional().isIn(values).withMessage(`${field} doit être l'une des valeurs suivantes: ${values.join(', ')}`)
  }),
  array: {
    required: (field) => body(field).exists().withMessage(`${field} est requis`).isArray().withMessage(`${field} doit être un tableau`),
    optional: (field) => body(field).optional().isArray().withMessage(`${field} doit être un tableau`)
  },
  object: {
    required: (field) => body(field).exists().withMessage(`${field} est requis`).isObject().withMessage(`${field} doit être un objet`),
    optional: (field) => body(field).optional().isObject().withMessage(`${field} doit être un objet`)
  },
  mongoId: {
    required: (field) => body(field).exists().withMessage(`${field} est requis`).isMongoId().withMessage(`${field} doit être un ID MongoDB valide`),
    optional: (field) => body(field).optional().isMongoId().withMessage(`${field} doit être un ID MongoDB valide`)
  },
  float: {
    required: (field) => body(field).exists().withMessage(`${field} est requis`).isFloat().withMessage(`${field} doit être un nombre décimal`),
    optional: (field) => body(field).optional().isFloat().withMessage(`${field} doit être un nombre décimal`)
  },
  postalCode: {
    required: (field) => body(field).exists().withMessage(`${field} est requis`).isPostalCode('any').withMessage(`${field} doit être un code postal valide`),
    optional: (field) => body(field).optional().isPostalCode('any').withMessage(`${field} doit être un code postal valide`)
  },
  mobilePhone: {
    required: (field) => body(field).exists().withMessage(`${field} est requis`).isMobilePhone('any').withMessage(`${field} doit être un numéro de téléphone valide`),
    optional: (field) => body(field).optional().isMobilePhone('any').withMessage(`${field} doit être un numéro de téléphone valide`)
  }
};

/**
 * Fonctions de validation génériques pour les query parameters
 */
const queryValidation = {
  // Méthodes de base
  integer: (field) => query(field).optional().isInt().withMessage(`${field} doit être un nombre entier`).toInt(),
  string: (field) => query(field).optional().isString().withMessage(`${field} doit être une chaîne de caractères`).trim(),
  boolean: (field) => query(field).optional().isBoolean().withMessage(`${field} doit être un booléen`).toBoolean(),
  date: (field) => query(field).optional().isISO8601().withMessage(`${field} doit être une date valide`),
  uuid: (field) => query(field).optional().isUUID().withMessage(`${field} doit être un UUID valide`),
  mongoId: (field) => query(field).optional().isMongoId().withMessage(`${field} doit être un ID MongoDB valide`),
  float: (field) => query(field).optional().isFloat().withMessage(`${field} doit être un nombre décimal`).toFloat(),
  enum: (values) => (field) => query(field).optional().isIn(values).withMessage(`${field} doit être l'une des valeurs suivantes: ${values.join(', ')}`),

  // Validations spécifiques
  page: query('page').optional().isInt({ min: 1 }).withMessage('Le numéro de page doit être un entier positif').toInt(),
  limit: query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être entre 1 et 100').toInt(),

  // Validations composées
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Le numéro de page doit être un entier positif').toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être entre 1 et 100').toInt()
  ],

  dateRange: [
    query('date_debut').optional().isISO8601().withMessage('Date de début invalide'),
    query('date_fin').optional().isISO8601().withMessage('Date de fin invalide')
      .custom((value, { req }) => {
        if (req.query.date_debut && value && new Date(value) <= new Date(req.query.date_debut)) {
          throw new Error('La date de fin doit être après la date de début');
        }
        return true;
      })
  ]
};

/**
 * Fonctions de validation génériques pour les paramètres d'URL
 */
const paramValidation = {
  id: param('id').isUUID().withMessage('ID invalide'),
  uuid: (field) => param(field).isUUID().withMessage(`${field} doit être un UUID valide`),
  mongoId: (field) => param(field).isMongoId().withMessage(`${field} doit être un ID MongoDB valide`),
  integer: (field) => param(field).isInt().withMessage(`${field} doit être un nombre entier`).toInt()
};

/**
 * Validations pour l'authentification
 */
const authValidation = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Email invalide')
      .isLength({ max: 255 })
      .withMessage('Email trop long'),

    body('password')
      .isLength({ min: 12 })
      .withMessage('Le mot de passe doit contenir au moins 12 caractères')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'),

    body('nom')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Le nom doit contenir entre 2 et 100 caractères')
      .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/)
      .withMessage('Le nom contient des caractères invalides'),

    body('prenom')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Le prénom doit contenir entre 2 et 100 caractères')
      .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/)
      .withMessage('Le prénom contient des caractères invalides'),

    body('role')
      .isIn(Object.values(RoleUtilisateur))
      .withMessage('Rôle utilisateur invalide'),

    body('telephone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Numéro de téléphone invalide'),

    body('etablissement_id')
      .optional()
      .isUUID()
      .withMessage('ID établissement invalide')
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Email invalide'),

    body('password')
      .notEmpty()
      .withMessage('Mot de passe requis'),

    body('twoFAToken')
      .optional()
      .isLength({ min: 6, max: 6 }).withMessage('Le code 2FA doit contenir 6 chiffres')
      .isNumeric().withMessage('Le code 2FA doit être numérique')
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Mot de passe actuel requis'),

    body('newPassword')
      .isLength({ min: 12 })
      .withMessage('Le nouveau mot de passe doit contenir au moins 12 caractères')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial')
  ],

  forgotPassword: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Email invalide')
  ],

  resetPassword: [
    body('token')
      .notEmpty()
      .withMessage('Token de réinitialisation requis'),

    body('newPassword')
      .isLength({ min: 12 })
      .withMessage('Le nouveau mot de passe doit contenir au moins 12 caractères')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial')
  ]
};

/**
 * Validations pour les établissements
 */
const etablissementValidation = {
  create: [
    body('nom')
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('Le nom doit contenir entre 2 et 255 caractères'),

    body('type')
      .isIn(Object.values(TypeEtablissement))
      .withMessage('Type d\'établissement invalide'),

    body('adresse')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('L\'adresse est trop longue'),

    body('ville')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Le nom de ville est trop long'),

    body('code_postal')
      .optional()
      .isPostalCode('any')
      .withMessage('Code postal invalide'),

    body('telephone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Numéro de téléphone invalide'),

    body('email')
      .optional()
      .isEmail()
      .withMessage('Email invalide'),

    body('site_web')
      .optional()
      .isURL()
      .withMessage('URL de site web invalide'),

    body('fuseau_horaire')
      .optional()
      .isIn(['Europe/Paris', 'Europe/Berlin', 'UTC', 'Europe/London', 'Africa/Lome'])
      .withMessage('Fuseau horaire non supporté'),

    body('langue')
      .optional()
      .isLength({ min: 2, max: 2 })
      .withMessage('Code langue invalide (2 caractères)'),

    body('annee_scolaire_courante')
      .matches(/^\d{4}-\d{4}$/)
      .withMessage('Format d\'année scolaire invalide (YYYY-YYYY)'),

    body('statut')
      .optional()
      .isIn(Object.values(StatutEtablissement))
      .withMessage('Statut d\'établissement invalide')
  ],

  update: [
    body('nom')
      .optional()
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('Le nom doit contenir entre 2 et 255 caractères'),

    body('type')
      .optional()
      .isIn(Object.values(TypeEtablissement))
      .withMessage('Type d\'établissement invalide'),

    body('statut')
      .optional()
      .isIn(Object.values(StatutEtablissement))
      .withMessage('Statut d\'établissement invalide')
  ],

  idParam: [
    param('id')
      .isUUID()
      .withMessage('ID établissement invalide')
  ]
};

/**
 * Validations pour les classes
 */
const classeValidation = {
  create: [
    body('nom_classe')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Le nom de classe doit contenir entre 1 et 50 caractères'),

    body('niveau')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Le niveau doit contenir entre 1 et 50 caractères'),

    body('filiere')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('La filière est trop longue'),

    body('effectif')
      .isInt({ min: 1, max: 500 })
      .withMessage('L\'effectif doit être entre 1 et 500'),

    body('annee_scolaire')
      .matches(/^\d{4}-\d{4}$/)
      .withMessage('Format d\'année scolaire invalide (YYYY-YYYY)'),

    body('salle_principale')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Le nom de salle est trop long'),

    body('statut')
      .optional()
      .isIn(Object.values(StatutClasse))
      .withMessage('Statut de classe invalide')
  ],

  update: [
    body('nom_classe')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Le nom de classe doit contenir entre 1 et 50 caractères'),

    body('effectif')
      .optional()
      .isInt({ min: 1, max: 500 })
      .withMessage('L\'effectif doit être entre 1 et 500'),

    body('statut')
      .optional()
      .isIn(Object.values(StatutClasse))
      .withMessage('Statut de classe invalide')
  ],

  idParam: [
    param('id')
      .isUUID()
      .withMessage('ID classe invalide')
  ]
};

/**
 * Validations pour les matières
 */
const matiereValidation = {
  create: [
    body('nom_matiere')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Le nom de matière doit contenir entre 2 et 100 caractères'),

    body('code_matiere')
      .trim()
      .isLength({ min: 1, max: 20 })
      .withMessage('Le code matière doit contenir entre 1 et 20 caractères')
      .matches(/^[A-Z0-9]+$/)
      .withMessage('Le code matière ne doit contenir que des majuscules et chiffres'),

    body('categorie')
      .isIn(Object.values(CategorieMatiere))
      .withMessage('Catégorie de matière invalide'),

    body('coefficient')
      .optional()
      .isFloat({ min: 0.1, max: 10.0 })
      .withMessage('Le coefficient doit être entre 0.1 et 10.0'),

    body('couleur_affichage')
      .optional()
      .matches(/^#[0-9A-F]{6}$/i)
      .withMessage('Couleur invalide (format hexadécimal: #RRGGBB)'),

    body('type_cours')
      .isIn(Object.values(TypeCours))
      .withMessage('Type de cours invalide'),

    body('duree_standard')
      .isInt({ min: 30, max: 240 })
      .withMessage('La durée standard doit être entre 30 et 240 minutes'),

    body('volume_horaire_hebdo')
      .isInt({ min: 30, max: 600 })
      .withMessage('Le volume horaire hebdomadaire doit être entre 30 et 600 minutes')
  ],

  update: [
    body('nom_matiere')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Le nom de matière doit contenir entre 2 et 100 caractères'),

    body('coefficient')
      .optional()
      .isFloat({ min: 0.1, max: 10.0 })
      .withMessage('Le coefficient doit être entre 0.1 et 10.0'),

    body('duree_standard')
      .optional()
      .isInt({ min: 30, max: 240 })
      .withMessage('La durée standard doit être entre 30 et 240 minutes')
  ],

  idParam: [
    param('id')
      .isUUID()
      .withMessage('ID matière invalide')
  ]
};

/**
 * Validations pour les enseignants
 */
const enseignantValidation = {
  create: [
    body('matricule')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Le matricule doit contenir entre 1 et 50 caractères'),

    body('statut')
      .isIn(Object.values(StatutProfessionnel))
      .withMessage('Statut professionnel invalide'),

    body('date_embauche')
      .isDate()
      .withMessage('Date d\'embauche invalide')
      .isBefore(new Date().toISOString().split('T')[0])
      .withMessage('La date d\'embauche doit être dans le passé'),

    body('heures_contractuelles_hebdo')
      .isInt({ min: 300, max: 2400 })
      .withMessage('Les heures contractuelles doivent être entre 300 et 2400 minutes (5-40h)'),

    body('heures_max_journalieres')
      .optional()
      .isInt({ min: 180, max: 600 })
      .withMessage('Les heures maximales journalières doivent être entre 180 et 600 minutes (3-10h)'),

    body('cours_consecutifs_max')
      .optional()
      .isInt({ min: 1, max: 8 })
      .withMessage('Le nombre maximum de cours consécutifs doit être entre 1 et 8'),

    body('preference_horaire')
      .optional()
      .isIn(Object.values(PreferenceHoraire))
      .withMessage('Préférence horaire invalide')
  ],

  update: [
    body('matricule')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Le matricule doit contenir entre 1 et 50 caractères'),

    body('heures_contractuelles_hebdo')
      .optional()
      .isInt({ min: 300, max: 2400 })
      .withMessage('Les heures contractuelles doivent être entre 300 et 2400 minutes (5-40h)')
  ],

  idParam: [
    param('id')
      .isUUID()
      .withMessage('ID enseignant invalide')
  ]
};

/**
 * Validations pour les salles
 */
const salleValidation = {
  create: [
    body('nom_salle')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Le nom de salle doit contenir entre 1 et 50 caractères'),

    body('type_salle')
      .isIn(Object.values(TypeSalle))
      .withMessage('Type de salle invalide'),

    body('capacite')
      .isInt({ min: 1, max: 1000 })
      .withMessage('La capacité doit être entre 1 et 1000 places'),

    body('surface')
      .optional()
      .isFloat({ min: 10, max: 1000 })
      .withMessage('La surface doit être entre 10 et 1000 m²'),

    body('batiment')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Le nom de bâtiment est trop long'),

    body('etage')
      .optional()
      .trim()
      .isLength({ max: 10 })
      .withMessage('L\'étage est trop long'),

    body('statut')
      .optional()
      .isIn(Object.values(StatutSalle))
      .withMessage('Statut de salle invalide')
  ],

  update: [
    body('nom_salle')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Le nom de salle doit contenir entre 1 et 50 caractères'),

    body('capacite')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('La capacité doit être entre 1 et 1000 places'),

    body('statut')
      .optional()
      .isIn(Object.values(StatutSalle))
      .withMessage('Statut de salle invalide')
  ],

  idParam: [
    param('id')
      .isUUID()
      .withMessage('ID salle invalide')
  ]
};

/**
 * Validations pour les emplois du temps
 */
const emploiTempsValidation = {
  generer: [
    body('classe_id')
      .isUUID()
      .withMessage('ID classe invalide'),

    body('nom_version')
      .notEmpty().withMessage('Le nom de la version est requis')
      .isLength({ min: 1, max: 255 }).withMessage('Le nom doit contenir entre 1 et 255 caractères')
      .trim(),

    body('periode_debut')
      .isDate()
      .withMessage('Date de début invalide'),

    body('periode_fin')
      .isDate()
      .withMessage('Date de fin invalide')
      .custom((value, { req }) => {
        if (req.body.periode_debut && value <= req.body.periode_debut) {
          throw new Error('La date de fin doit être après la date de début');
        }
        return true;
      }),

    body('mode_generation')
      .optional()
      .isIn(Object.values(ModeGeneration))
      .withMessage('Mode de génération invalide'),

    body('parametres_generation')
      .optional()
      .isObject()
      .withMessage('Les paramètres de génération doivent être un objet JSON'),

    body('nom_version')
      .notEmpty().withMessage('Le nom de la version est requis')
      .isLength({ min: 1, max: 255 }).withMessage('Le nom doit contenir entre 1 et 255 caractères')
      .trim(),
  ],

  valider: [
    body('code_acces')
      .isLength({ min: 16, max: 16 })
      .withMessage('Code d\'accès invalide')
      .matches(/^[A-Z0-9]{16}$/)
      .withMessage('Format de code d\'accès invalide')
  ],

  idParam: [
    param('id')
      .isUUID()
      .withMessage('ID emploi du temps invalide')
  ],
  seance: [
    body('emploi_temps_id')
      .optional()
      .isUUID().withMessage('L\'ID de l\'emploi du temps doit être un UUID valide'),

    body('cours_id')
      .notEmpty().withMessage('L\'ID du cours est requis')
      .isUUID().withMessage('L\'ID du cours doit être un UUID valide'),

    body('salle_id')
      .optional({ nullable: true })
      .isUUID().withMessage('L\'ID de la salle doit être un UUID valide'),

    body('jour_semaine')
      .notEmpty().withMessage('Le jour de la semaine est requis')
      .isIn(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'])
      .withMessage('Jour de la semaine invalide'),

    body('heure_debut')
      .notEmpty().withMessage('L\'heure de début est requise')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('L\'heure de début doit être au format HH:MM'),

    body('heure_fin')
      .notEmpty().withMessage('L\'heure de fin est requise')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('L\'heure de fin doit être au format HH:MM')
      .custom((value, { req }) => {
        if (value <= req.body.heure_debut) {
          throw new Error('L\'heure de fin doit être après l\'heure de début');
        }
        return true;
      }),

    body('date_debut_validite')
      .optional({ nullable: true })
      .isISO8601().withMessage('La date de début de validité doit être au format ISO8601'),

    body('date_fin_validite')
      .optional({ nullable: true })
      .isISO8601().withMessage('La date de fin de validité doit être au format ISO8601')
      .custom((value, { req }) => {
        if (value && req.body.date_debut_validite && new Date(value) < new Date(req.body.date_debut_validite)) {
          throw new Error('La date de fin de validité doit être après la date de début de validité');
        }
        return true;
      }),

    body('est_rattrapage')
      .optional()
      .isBoolean().withMessage('Le champ est_rattrapage doit être un booléen')
  ],

  annulation: [
    body('motif')
      .notEmpty().withMessage('Le motif d\'annulation est requis')
      .isLength({ min: 10, max: 500 })
      .withMessage('Le motif doit contenir entre 10 et 500 caractères')
      .trim()
  ]
};

/**
 * Validations pour les rattrapages
 */
const rattrapageValidation = {
  create: [
    body('cours_id')
      .isUUID()
      .withMessage('ID cours invalide'),

    body('type_rattrapage')
      .isIn(Object.values(TypeRattrapage))
      .withMessage('Type de rattrapage invalide'),

    body('duree')
      .isInt({ min: 30, max: 240 })
      .withMessage('La durée doit être entre 30 et 240 minutes'),

    body('eleves_concernes')
      .custom(value => {
        if (value === 'tous') return true;
        if (Array.isArray(value) && value.length > 0) return true;
        throw new Error('Élèves concernés invalides (doit être "tous" ou une liste d\'élèves)');
      }),

    body('motif')
      .isLength({ min: 5, max: 1000 })
      .withMessage('Le motif doit contenir entre 5 et 1000 caractères'),

    body('periode_souhaitee_debut')
      .optional()
      .isDate()
      .withMessage('Date de début souhaitée invalide'),

    body('periode_souhaitee_fin')
      .optional()
      .isDate()
      .withMessage('Date de fin souhaitée invalide')
      .custom((value, { req }) => {
        if (req.body.periode_souhaitee_debut && value <= req.body.periode_souhaitee_debut) {
          throw new Error('La date de fin souhaitée doit être après la date de début');
        }
        return true;
      })
  ],

  planifier: [
    body('creneau_id')
      .isUUID()
      .withMessage('ID créneau invalide')
  ],

  idParam: [
    param('id')
      .isUUID()
      .withMessage('ID rattrapage invalide')
  ]
};

/**
 * Validations pour les notifications
 */
const notificationValidation = {
  create: [
    body('utilisateur_id')
      .isUUID()
      .withMessage('ID utilisateur invalide'),

    body('type')
      .optional()
      .isIn(Object.values(TypeNotification))
      .withMessage('Type de notification invalide'),

    body('titre')
      .trim()
      .notEmpty()
      .withMessage('Le titre est requis')
      .isLength({ max: 255 })
      .withMessage('Le titre est trop long'),

    body('message')
      .trim()
      .notEmpty()
      .withMessage('Le message est requis')
      .isLength({ max: 1000 })
      .withMessage('Le message est trop long'),

    body('lien_action')
      .optional()
      .isURL()
      .withMessage('URL invalide')
      .isLength({ max: 500 })
      .withMessage('Le lien est trop long'),

    body('canal')
      .optional()
      .isIn(Object.values(CanalNotification))
      .withMessage('Canal de notification invalide'),

    body('priorite')
      .optional()
      .isIn(Object.values(PrioriteNotification))
      .withMessage('Priorité invalide')
  ],

  cleanup: [
    body('jours')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Le nombre de jours doit être entre 1 et 365')
  ],

  idParam: [
    param('id')
      .isUUID()
      .withMessage('ID notification invalide')
  ]
};

/**
 * Validations pour les exports
 */
const exportValidation = {
  format: [
    query('format')
      .isIn(Object.values(FormatExport))
      .withMessage('Format d\'export invalide')
  ]
};

/**
 * Validations pour les contraintes
 */
const contrainteValidation = {
  create: [
    body('type_contrainte')
      .isIn(Object.values(TypeContrainte))
      .withMessage('Type de contrainte invalide'),

    body('categorie')
      .isIn(Object.values(CategorieContrainte))
      .withMessage('Catégorie de contrainte invalide'),

    body('priorite')
      .isIn(Object.values(PrioriteContrainte))
      .withMessage('Priorité de contrainte invalide'),

    body('description')
      .trim()
      .isLength({ min: 5, max: 1000 })
      .withMessage('La description doit contenir entre 5 et 1000 caractères'),

    body('donnees_contrainte')
      .isObject()
      .withMessage('Les données de contrainte doivent être un objet JSON'),

    body('est_globale')
      .optional()
      .isBoolean()
      .withMessage('est_globale doit être un booléen'),

    body('applicable_a_partir')
      .optional()
      .isDate()
      .withMessage('Date d\'applicabilité invalide'),

    body('applicable_jusqu_a')
      .optional()
      .isDate()
      .withMessage('Date d\'expiration invalide')
      .custom((value, { req }) => {
        if (req.body.applicable_a_partir && value && new Date(value) <= new Date(req.body.applicable_a_partir)) {
          throw new Error('La date d\'expiration doit être après la date d\'applicabilité');
        }
        return true;
      })
  ],

  idParam: [
    param('id')
      .isUUID()
      .withMessage('ID contrainte invalide')
  ]
};

/**
 * Middleware de validation de fichier
 */
const validateFile = (allowedTypes, maxSize) => {
  return (req, res, next) => {
    if (!req.file) {
      return next();
    }

    // Vérifier le type MIME
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: 'Type de fichier non autorisé',
        allowed_types: allowedTypes,
        code: 'INVALID_FILE_TYPE'
      });
    }

    // Vérifier la taille
    if (req.file.size > maxSize) {
      return res.status(400).json({
        error: `Fichier trop volumineux (max: ${maxSize / 1024 / 1024}MB)`,
        code: 'FILE_TOO_LARGE'
      });
    }

    next();
  };
};

/**
 * Fonction utilitaire pour créer des validations personnalisées
 */
const createCustomValidation = (schema) => {
  const validations = [];

  for (const [field, rules] of Object.entries(schema)) {
    let validation = body(field);

    if (rules.required) {
      validation = validation.exists().withMessage(`${field} est requis`);
    } else {
      validation = validation.optional();
    }

    if (rules.type === 'string') {
      validation = validation.isString().withMessage(`${field} doit être une chaîne`);
      if (rules.min) validation = validation.isLength({ min: rules.min });
      if (rules.max) validation = validation.isLength({ max: rules.max });
      validation = validation.trim();
    } else if (rules.type === 'integer') {
      validation = validation.isInt().withMessage(`${field} doit être un entier`);
      if (rules.min) validation = validation.isInt({ min: rules.min });
      if (rules.max) validation = validation.isInt({ max: rules.max });
    } else if (rules.type === 'boolean') {
      validation = validation.isBoolean().withMessage(`${field} doit être un booléen`);
    } else if (rules.type === 'email') {
      validation = validation.isEmail().withMessage(`${field} doit être un email valide`);
    } else if (rules.type === 'enum') {
      validation = validation.isIn(rules.values).withMessage(`${field} doit être l'une des valeurs: ${rules.values.join(', ')}`);
    }

    validations.push(validation);
  }

  return validations;
};

module.exports = {
  // Middleware principal
  handleValidationErrors,

  // Validations génériques
  bodyValidation,
  queryValidation,
  paramValidation,

  // Validations spécifiques par module
  authValidation,
  etablissementValidation,
  classeValidation,
  matiereValidation,
  enseignantValidation,
  salleValidation,
  emploiTempsValidation,
  rattrapageValidation,
  notificationValidation,
  contrainteValidation,
  exportValidation,

  // Utilitaires
  validateFile,
  createCustomValidation
};