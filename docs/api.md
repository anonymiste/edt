# API Documentation - Générateur d'Emplois du Temps

## Base URL
`http://localhost:5000/api`

## Authentification
Les endpoints protégés nécessitent un header d'autorisation:
Authorization: Bearer <JWT_TOKEN>

text

## Endpoints Principaux

### Authentification

#### POST /auth/register
Inscription d'un nouvel utilisateur

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "nom": "Dupont",
  "prenom": "Jean",
  "role": "enseignant",
  "telephone": "+33123456789"
}
POST /auth/login
Connexion d'un utilisateur

Body:

json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
GET /auth/me
Récupérer le profil de l'utilisateur connecté

Établissements
GET /etablissements
Lister tous les établissements (Admin seulement)

POST /etablissements
Créer un nouvel établissement (Admin seulement)

Body:

json
{
  "nom": "Lycée Victor Hugo",
  "type": "lycee",
  "adresse": "123 Rue de l'Éducation",
  "ville": "Paris",
  "code_postal": "75001",
  "annee_scolaire_courante": "2024-2025"
}
Codes de Statut
200 Succès

201 Créé avec succès

400 Données invalides

401 Non authentifié

403 Permissions insuffisantes

404 Ressource non trouvée

409 Conflit (ex: email déjà utilisé)

500 Erreur serveur

Sécurité
Authentification JWT

Mots de passe hashés avec bcrypt (coût 12)

Validation des données d'entrée

Rate limiting (100 req/15min par IP)

Headers de sécurité Helmet.js

text

## Prochaines Étapes

1. **Tester l'installation** :
```bash
npm run setup
Démarrer le serveur :

bash
npm run dev
Tester les endpoints avec Postman ou curl

Implémenter les autres modules :

Gestion des emplois du temps

Module de rattrapage

Algorithmes de génération

Système de notifications

Cette structure vous donne une base solide pour utiliser mon application de generation d'emploie du temps scolaire, universitaire, institutionnel, académique. Le code est bien commenté et structuré pour faciliter les customisations futures.



backend/
├── package.json
├── server.js
├── .env
├── config/
│   ├── database.js
│   └── config.js
├── database/
│   ├── migrations/
│   │   ├── 001-create-tables.js
│   │   └── run-migrations.js
│   ├── seeds/
│   │   └── test-data.js
│   └── models/
│       ├── index.js
│       ├── Utilisateur.js
│       ├── Etablissement.js
│       ├── Classe.js
│       ├── Matiere.js
│       ├── Enseignant.js
│       ├── Salle.js
│       ├── Cours.js
│       ├── CreneauCours.js
│       ├── EmploiTemps.js
│       ├── Rattrapage.js
│       ├── Absence.js
│       ├── Disponibilite.js
│       ├── Contrainte.js
│       ├── Notification.js
│       └── Log.js
├── middleware/
│   ├── auth.js
│   ├── validation.js
│   └── rateLimit.js
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── etablissementController.js
│   ├── classeController.js
│   ├── matiereController.js
│   ├── enseignantController.js
│   ├── salleController.js
│   ├── coursController.js
│   ├── emploiTempsController.js
│   ├── rattrapageController.js
│   ├── absenceController.js
│   └── statistiqueController.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── etablissements.js
│   ├── classes.js
│   ├── matieres.js
│   ├── enseignants.js
│   ├── salles.js
│   ├── cours.js
│   ├── emplois-temps.js
│   ├── rattrapages.js
│   ├── absences.js
│   └── statistiques.js
├── services/
│   ├── authService.js
│   ├── generationService.js
│   ├── notificationService.js
│   ├── emailService.js
│   └── algorithmes/
│       ├── cspAlgorithm.js
│       ├── geneticAlgorithm.js
│       └── constraintEngine.js
├── utils/
│   ├── enums.js
│   ├── validators.js
│   ├── helpers.js
│   └── timeUtils.js
├── scripts/
│   ├── test-api.js
│   └── setup-db.js
└── docs/
    └── api.md