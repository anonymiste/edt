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
      .withMessage('Code postal Togolais invalide'),

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
      .isIn(['Europe/Paris', 'Europe/Berlin', 'UTC', 'Europe/London'])
      .withMessage('Fuseau horaire non supporté'),

    body('langue')
      .optional()
      .isLength({ min: 2, max: 2 })
      .withMessage('Code langue invalide (2 caractères)'),

    body('annee_scolaire_courante')
      .matches(/^\d{4}-\d{4}$/)
      .withMessage('Format d\'année scolaire invalide (YYYY-YYYY)')
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
      .withMessage('Statut invalide')
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
      .withMessage('Les paramètres de génération doivent être un objet JSON')
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
 * Validations pour les query parameters communs
 */
const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Le numéro de page doit être un entier positif'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('La limite doit être entre 1 et 100')
  ],

  dateRange: [
    query('date_debut')
      .optional()
      .isDate()
      .withMessage('Date de début invalide'),

    query('date_fin')
      .optional()
      .isDate()
      .withMessage('Date de fin invalide')
      .custom((value, { req }) => {
        if (req.query.date_debut && value <= req.query.date_debut) {
          throw new Error('La date de fin doit être après la date de début');
        }
        return true;
      })
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

module.exports = {
  handleValidationErrors,
  authValidation,
  etablissementValidation,
  classeValidation,
  matiereValidation,
  enseignantValidation,
  salleValidation,
  emploiTempsValidation,
  rattrapageValidation,
  queryValidation,
  exportValidation,
  validateFile
};