// scripts/test-api.js
const axios = require('axios');
const { performance } = require('perf_hooks');

/**
 * Script de test de l'API EmploiDuTemps
 */
class APITester {
  constructor(baseURL = 'http://localhost:3000/api') {
    this.baseURL = baseURL;
    this.authToken = null;
    this.testResults = [];
  }

  /**
   * Exécuter tous les tests
   */
  async runAllTests() {
    console.log('🚀 Démarrage des tests API...\n');
    
    try {
      await this.testAuthentication();
      await this.testUsers();
      await this.testEtablissements();
      await this.testClasses();
      await this.testMatieres();
      await this.testEnseignants();
      await this.testSalles();
      await this.testCours();
      await this.testEmploisTemps();
      await this.testRattrapages();
      await this.testAbsences();
      await this.testStatistiques();

      this.generateReport();
    } catch (error) {
      console.error('❌ Erreur lors des tests:', error.message);
    }
  }

  /**
   * Test d'authentification
   */
  async testAuthentication() {
    console.log('🔐 Tests d\'authentification...');
    
    const tests = [
      {
        name: 'Inscription nouvel utilisateur',
        method: 'POST',
        endpoint: '/auth/register',
        data: {
          email: 'test@example.com',
          password: 'TestPassword123!',
          nom: 'Dupont',
          prenom: 'Jean',
          role: 'enseignant',
          telephone: '+33123456789'
        },
        expect: 201
      },
      {
        name: 'Connexion',
        method: 'POST',
        endpoint: '/auth/login',
        data: {
          email: 'test@example.com',
          password: 'TestPassword123!'
        },
        expect: 200
      },
      {
        name: 'Profil utilisateur',
        method: 'GET',
        endpoint: '/auth/profile',
        expect: 200,
        requiresAuth: true
      }
    ];

    await this.runTestSuite('Authentication', tests);
  }

  /**
   * Test des utilisateurs
   */
  async testUsers() {
    console.log('👥 Tests des utilisateurs...');
    
    const tests = [
      {
        name: 'Liste des utilisateurs',
        method: 'GET',
        endpoint: '/users',
        expect: 200,
        requiresAuth: true
      },
      {
        name: 'Création utilisateur',
        method: 'POST',
        endpoint: '/users',
        data: {
          email: 'nouveau@example.com',
          password: 'NouveauPass123!',
          nom: 'Martin',
          prenom: 'Marie',
          role: 'enseignant',
          telephone: '+33123456780'
        },
        expect: 201,
        requiresAuth: true
      }
    ];

    await this.runTestSuite('Users', tests);
  }

  /**
   * Test des établissements
   */
  async testEtablissements() {
    console.log('🏫 Tests des établissements...');
    
    const tests = [
      {
        name: 'Liste des établissements',
        method: 'GET',
        endpoint: '/etablissements',
        expect: 200,
        requiresAuth: true
      },
      {
        name: 'Création établissement',
        method: 'POST',
        endpoint: '/etablissements',
        data: {
          nom: 'Lycée Test',
          type: 'lycee',
          ville: 'Paris',
          code_postal: '75001',
          annee_scolaire_courante: '2024-2025'
        },
        expect: 201,
        requiresAuth: true
      }
    ];

    await this.runTestSuite('Etablissements', tests);
  }

  /**
   * Test des classes
   */
  async testClasses() {
    console.log('📚 Tests des classes...');
    
    const tests = [
      {
        name: 'Liste des classes',
        method: 'GET',
        endpoint: '/classes',
        expect: 200,
        requiresAuth: true
      },
      {
        name: 'Création classe',
        method: 'POST',
        endpoint: '/classes',
        data: {
          nom_classe: 'Terminale A',
          niveau: 'Terminale',
          effectif: 30,
          annee_scolaire: '2024-2025'
        },
        expect: 201,
        requiresAuth: true
      }
    ];

    await this.runTestSuite('Classes', tests);
  }

  /**
   * Test des matières
   */
  async testMatieres() {
    console.log('📖 Tests des matières...');
    
    const tests = [
      {
        name: 'Liste des matières',
        method: 'GET',
        endpoint: '/matieres',
        expect: 200,
        requiresAuth: true
      },
      {
        name: 'Création matière',
        method: 'POST',
        endpoint: '/matieres',
        data: {
          nom_matiere: 'Mathématiques',
          code_matiere: 'MATH-TS',
          categorie: 'fondamentale',
          type_cours: 'cours_magistral',
          duree_standard: 60,
          volume_horaire_hebdo: 180
        },
        expect: 201,
        requiresAuth: true
      }
    ];

    await this.runTestSuite('Matieres', tests);
  }

  /**
   * Test des enseignants
   */
  async testEnseignants() {
    console.log('👨‍🏫 Tests des enseignants...');
    
    const tests = [
      {
        name: 'Liste des enseignants',
        method: 'GET',
        endpoint: '/enseignants',
        expect: 200,
        requiresAuth: true
      }
    ];

    await this.runTestSuite('Enseignants', tests);
  }

  /**
   * Test des salles
   */
  async testSalles() {
    console.log('🏠 Tests des salles...');
    
    const tests = [
      {
        name: 'Liste des salles',
        method: 'GET',
        endpoint: '/salles',
        expect: 200,
        requiresAuth: true
      },
      {
        name: 'Création salle',
        method: 'POST',
        endpoint: '/salles',
        data: {
          nom_salle: 'Salle 101',
          type_salle: 'standard',
          capacite: 30,
          batiment: 'Bâtiment A'
        },
        expect: 201,
        requiresAuth: true
      }
    ];

    await this.runTestSuite('Salles', tests);
  }

  /**
   * Test des cours
   */
  async testCours() {
    console.log('📅 Tests des cours...');
    
    const tests = [
      {
        name: 'Liste des cours',
        method: 'GET',
        endpoint: '/cours',
        expect: 200,
        requiresAuth: true
      }
    ];

    await this.runTestSuite('Cours', tests);
  }

  /**
   * Test des emplois du temps
   */
  async testEmploisTemps() {
    console.log('🗓️ Tests des emplois du temps...');
    
    const tests = [
      {
        name: 'Liste des emplois du temps',
        method: 'GET',
        endpoint: '/emplois-temps',
        expect: 200,
        requiresAuth: true
      }
    ];

    await this.runTestSuite('EmploisTemps', tests);
  }

  /**
   * Test des rattrapages
   */
  async testRattrapages() {
    console.log('🔄 Tests des rattrapages...');
    
    const tests = [
      {
        name: 'Liste des rattrapages',
        method: 'GET',
        endpoint: '/rattrapages',
        expect: 200,
        requiresAuth: true
      }
    ];

    await this.runTestSuite('Rattrapages', tests);
  }

  /**
   * Test des absences
   */
  async testAbsences() {
    console.log('👨‍🏫 Tests des absences...');
    
    const tests = [
      {
        name: 'Liste des absences',
        method: 'GET',
        endpoint: '/absences',
        expect: 200,
        requiresAuth: true
      }
    ];

    await this.runTestSuite('Absences', tests);
  }

  /**
   * Test des statistiques
   */
  async testStatistiques() {
    console.log='📊 Tests des statistiques...';
    
    const tests = [
      {
        name: 'Statistiques générales',
        method: 'GET',
        endpoint: '/statistiques/general',
        expect: 200,
        requiresAuth: true
      },
      {
        name: 'Tableau de bord',
        method: 'GET',
        endpoint: '/statistiques/dashboard',
        expect: 200,
        requiresAuth: true
      }
    ];

    await this.runTestSuite('Statistiques', tests);
  }

  /**
   * Exécuter une suite de tests
   */
  async runTestSuite(suiteName, tests) {
    const suiteResults = {
      name: suiteName,
      tests: [],
      passed: 0,
      failed: 0
    };

    for (const test of tests) {
      const startTime = performance.now();
      
      try {
        const response = await this.makeRequest(test);
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);

        const isSuccess = response.status === test.expect;
        
        if (isSuccess) {
          suiteResults.passed++;
          console.log(`  ✅ ${test.name} (${duration}ms)`);
        } else {
          suiteResults.failed++;
          console.log(`  ❌ ${test.name} - Attendu: ${test.expect}, Reçu: ${response.status}`);
        }

        suiteResults.tests.push({
          name: test.name,
          success: isSuccess,
          duration: duration + 'ms',
          status: response.status,
          response: isSuccess ? 'OK' : response.data
        });

      } catch (error) {
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);
        
        suiteResults.failed++;
        console.log(`  ❌ ${test.name} - Erreur: ${error.message}`);
        
        suiteResults.tests.push({
          name: test.name,
          success: false,
          duration: duration + 'ms',
          status: 'ERROR',
          response: error.message
        });
      }
    }

    this.testResults.push(suiteResults);
    console.log(`  ${suiteResults.passed}/${tests.length} tests réussis\n`);
  }

  /**
   * Faire une requête HTTP
   */
  async makeRequest(test) {
    const config = {
      method: test.method,
      url: this.baseURL + test.endpoint,
      headers: {}
    };

    if (test.requiresAuth && this.authToken) {
      config.headers.Authorization = `Bearer ${this.authToken}`;
    }

    if (test.data) {
      config.data = test.data;
    }

    const response = await axios(config);

    // Sauvegarder le token d'authentification
    if (test.endpoint === '/auth/login' && response.data.token) {
      this.authToken = response.data.token;
    }

    return response;
  }

  /**
   * Générer le rapport de test
   */
  generateReport() {
    console.log('\n📋 RAPPORT DE TEST COMPLET');
    console.log('=' .repeat(50));

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    this.testResults.forEach(suite => {
      console.log(`\n${suite.name}:`);
      console.log(`  ✅ ${suite.passed} réussis, ❌ ${suite.failed} échoués`);
      
      suite.tests.forEach(test => {
        const status = test.success ? '✅' : '❌';
        console.log(`    ${status} ${test.name} - ${test.duration} - ${test.response}`);
      });

      totalTests += suite.tests.length;
      totalPassed += suite.passed;
      totalFailed += suite.failed;
    });

    console.log('\n' + '=' .repeat(50));
    console.log(`RÉSUMÉ: ${totalPassed}/${totalTests} tests réussis (${((totalPassed/totalTests)*100).toFixed(1)}%)`);
    
    if (totalFailed === 0) {
      console.log('🎉 Tous les tests sont réussis!');
    } else {
      console.log(`⚠️  ${totalFailed} test(s) ont échoué`);
    }
  }
}

// Exécution des tests
if (require.main === module) {
  const tester = new APITester();
  tester.runAllTests().catch(console.error);
}

module.exports = APITester;