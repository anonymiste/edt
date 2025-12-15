/**
 * Script de vérification rapide des permissions par rôle + code établissement.
 * Paramètres via variables d'environnement :
 *  - BASE_URL (ex: http://localhost:3000/api)
 *  - ETAB_CODE (code d'accès établissement)
 *  - ADMIN_TOKEN, DIRECTEUR_TOKEN, RESP_TOKEN, ENSEIGNANT_TOKEN, PERSONNEL_TOKEN
 *  - ENSEIGNANT_ID (pour test self), AUTRE_ENSEIGNANT_ID (pour test cross)
 *  - CLASSE_ID, SALLE_ID (ressources existantes)
 *
 * Usage : node scripts/test-access-matrix.js
 */
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/api';
const ETAB_CODE = process.env.ETAB_CODE || '';

const TOKENS = {
  admin: process.env.ADMIN_TOKEN || '',
  directeur: process.env.DIRECTEUR_TOKEN || '',
  responsable: process.env.RESP_TOKEN || '',
  enseignant: process.env.ENSEIGNANT_TOKEN || '',
  personnel: process.env.PERSONNEL_TOKEN || ''
};

const IDS = {
  enseignantSelf: process.env.ENSEIGNANT_ID || '',
  enseignantAutre: process.env.AUTRE_ENSEIGNANT_ID || '',
  classe: process.env.CLASSE_ID || '',
  salle: process.env.SALLE_ID || '',
  cours: process.env.COURS_ID || '',
  absence: process.env.ABSENCE_ID || ''
};

const headersFor = (role, withCode = false) => {
  const token = TOKENS[role];
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (withCode && ETAB_CODE) headers['x-etablissement-code'] = ETAB_CODE;
  return headers;
};

const scenarios = [
  // Lectures enseignants : self vs cross
  {
    name: 'Enseignant lit son profil',
    method: 'get',
    url: `/enseignants/${IDS.enseignantSelf}`,
    role: 'enseignant',
    expect: 200
  },
  {
    name: 'Enseignant lit un autre enseignant',
    method: 'get',
    url: `/enseignants/${IDS.enseignantAutre}`,
    role: 'enseignant',
    expect: 403
  },
  // Création enseignant (écriture -> code exigé)
  {
    name: 'Responsable crée un enseignant sans code',
    method: 'post',
    url: '/enseignants',
    role: 'responsable',
    data: { utilisateur_id: 'dummy', matricule: 'XX123', statut: 'titulaire', heures_contractuelles_hebdo: 300 },
    expect: 400 // code requis -> 400
  },
  {
    name: 'Responsable crée un enseignant avec code',
    method: 'post',
    url: '/enseignants',
    role: 'responsable',
    withCode: true,
    data: { utilisateur_id: 'dummy', matricule: 'YY123', statut: 'titulaire', heures_contractuelles_hebdo: 300 },
    expect: 404 // user dummy introuvable si placeholder -> on attend pas 403
  },
  // Listing classes (personnel doit être refusé)
  {
    name: 'Personnel liste classes (doit être refusé)',
    method: 'get',
    url: '/classes',
    role: 'personnel',
    expect: 403
  },
  {
    name: 'Directeur liste classes',
    method: 'get',
    url: '/classes',
    role: 'directeur',
    expect: 200
  },
  // Création classe (code requis)
  {
    name: 'Directeur crée classe sans code',
    method: 'post',
    url: '/classes',
    role: 'directeur',
    data: { nom_classe: 'TEST-CLASS', niveau: 'test', effectif: 10, annee_scolaire: '2024-2025' },
    expect: 400 // code manquant
  },
  {
    name: 'Directeur crée classe avec code',
    method: 'post',
    url: '/classes',
    role: 'directeur',
    withCode: true,
    data: { nom_classe: 'TEST-CLASS2', niveau: 'test', effectif: 10, annee_scolaire: '2024-2025' },
    expect: 201 // si données valides
  },
  // Lecture salle (ouverte à tous authentifiés)
  {
    name: 'Enseignant lit salle',
    method: 'get',
    url: `/salles/${IDS.salle}`,
    role: 'enseignant',
    expect: 200
  },
  // Update salle (code requis, role gestion)
  {
    name: 'Responsable met à jour salle sans code',
    method: 'put',
    url: `/salles/${IDS.salle}`,
    role: 'responsable',
    data: { statut: 'maintenance' },
    expect: 400
  },
  {
    name: 'Responsable met à jour salle avec code',
    method: 'put',
    url: `/salles/${IDS.salle}`,
    role: 'responsable',
    withCode: true,
    data: { statut: 'maintenance' },
    expect: 200
  },
  // Absences : enseignant self-only
  {
    name: 'Enseignant déclare absence pour lui-même (code requis)',
    method: 'post',
    url: '/absences',
    role: 'enseignant',
    withCode: true,
    data: {
      enseignant_id: IDS.enseignantSelf,
      date_debut: '2025-01-10T08:00:00Z',
      date_fin: '2025-01-10T10:00:00Z',
      motif: 'Test auto',
      necessite_remplacement: false
    },
    expect: 201 // si données valides
  },
  {
    name: 'Enseignant déclare absence pour un autre enseignant (refus)',
    method: 'post',
    url: '/absences',
    role: 'enseignant',
    withCode: true,
    data: {
      enseignant_id: IDS.enseignantAutre,
      date_debut: '2025-01-10T08:00:00Z',
      date_fin: '2025-01-10T10:00:00Z',
      motif: 'Test cross',
      necessite_remplacement: false
    },
    expect: 403
  },
  {
    name: 'Enseignant lit sa propre absence',
    method: 'get',
    url: '/absences', // filtré self côté contrôleur
    role: 'enseignant',
    expect: 200
  },
  {
    name: 'Responsable valide une absence sans code',
    method: 'post',
    url: `/absences/${IDS.absence || 'dummy'}/validate`,
    role: 'responsable',
    expect: 400
  }
];

const runScenario = async (scenario) => {
  const { name, method, url, role, expect, data, withCode } = scenario;
  const headers = headersFor(role, withCode);
  try {
    const resp = await axios({
      method,
      url: `${BASE_URL}${url}`,
      data,
      headers,
      validateStatus: () => true
    });
    const ok = resp.status === expect;
    console.log(`${ok ? '✅' : '❌'} [${role}] ${name} -> ${resp.status} (attendu ${expect})`);
    if (!ok) {
      console.log('   Réponse:', JSON.stringify(resp.data));
    }
  } catch (error) {
    console.error(`❌ [${role}] ${name} -> erreur`, error.message);
  }
};

const main = async () => {
  console.log(`Test matrix BASE_URL=${BASE_URL}`);
  for (const sc of scenarios) {
    if (!TOKENS[sc.role]) {
      console.log(`⚠️  Token manquant pour rôle ${sc.role}, scénario ignoré: ${sc.name}`);
      continue;
    }
    if (sc.url.includes(':') && sc.url.includes('undefined')) {
      console.log(`⚠️  ID requis manquant pour scénario: ${sc.name}`);
      continue;
    }
    await runScenario(sc);
  }
};

main();

