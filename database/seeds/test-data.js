const bcrypt = require('bcryptjs');
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
  TypeDisponibilite
} = require('../../utils/enums');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🌱 Début du seeding des données de test...');

      // Hasher les mots de passe
      const hashedPassword = await bcrypt.hash('Password123!', 12);

      // 1. Création d'un établissement de test
      const etablissementId = '11111111-1111-1111-1111-111111111111';
      
      await queryInterface.bulkInsert('etablissements', [{
        id: etablissementId,
        nom: 'Lycée Victor Hugo',
        type: TypeEtablissement.LYCEE,
        adresse: '123 Avenue de l\'Éducation',
        ville: 'Paris',
        code_postal: '75001',
        telephone: '+33123456789',
        email: 'contact@lycee-victor-hugo.fr',
        site_web: 'https://www.lycee-victor-hugo.fr',
        code_acces: 'ABCD1234EFGH5678',
        fuseau_horaire: 'Europe/Paris',
        langue: 'fr',
        annee_scolaire_courante: '2024-2025',
        statut: 'actif',
        created_at: new Date(),
        updated_at: new Date()
      }], { transaction });

      console.log('✅ Établissement de test créé');

      // 2. Création des utilisateurs de test
      const utilisateurs = [
        // Administrateur système
        {
          id: '22222222-2222-2222-2222-222222222222',
          email: 'admin@edt-generator.com',
          mot_de_passe_hash: hashedPassword,
          nom: 'Système',
          prenom: 'Administrateur',
          role: RoleUtilisateur.ADMIN,
          deux_fa_active: true,
          actif: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        // Directeur
        {
          id: '33333333-3333-3333-3333-333333333333',
          email: 'directeur@lycee-victor-hugo.fr',
          mot_de_passe_hash: hashedPassword,
          nom: 'Martin',
          prenom: 'Pierre',
          role: RoleUtilisateur.DIRECTEUR,
          etablissement_id: etablissementId,
          actif: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        // Responsable pédagogique
        {
          id: '44444444-4444-4444-4444-444444444444',
          email: 'pedagogique@lycee-victor-hugo.fr',
          mot_de_passe_hash: hashedPassword,
          nom: 'Dubois',
          prenom: 'Marie',
          role: RoleUtilisateur.RESPONSABLE_PEDAGOGIQUE,
          etablissement_id: etablissementId,
          actif: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        // Enseignant 1
        {
          id: '55555555-5555-5555-5555-555555555555',
          email: 'dupont@lycee-victor-hugo.fr',
          mot_de_passe_hash: hashedPassword,
          nom: 'Dupont',
          prenom: 'Jean',
          role: RoleUtilisateur.ENSEIGNANT,
          etablissement_id: etablissementId,
          actif: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        // Enseignant 2
        {
          id: '66666666-6666-6666-6666-666666666666',
          email: 'leroy@lycee-victor-hugo.fr',
          mot_de_passe_hash: hashedPassword,
          nom: 'Leroy',
          prenom: 'Sophie',
          role: RoleUtilisateur.ENSEIGNANT,
          etablissement_id: etablissementId,
          actif: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        // Étudiant
        {
          id: '77777777-7777-7777-7777-777777777777',
          email: 'etudiant@lycee-victor-hugo.fr',
          mot_de_passe_hash: hashedPassword,
          nom: 'Bernard',
          prenom: 'Luc',
          role: RoleUtilisateur.ETUDIANT,
          etablissement_id: etablissementId,
          actif: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      await queryInterface.bulkInsert('utilisateurs', utilisateurs, { transaction });
      console.log('✅ Utilisateurs de test créés');

      // 3. Création des enseignants
      const enseignants = [
        {
          id: '88888888-8888-8888-8888-888888888888',
          utilisateur_id: '55555555-5555-5555-5555-555555555555',
          etablissement_id: etablissementId,
          matricule: 'ENS001',
          statut: StatutProfessionnel.TITULAIRE,
          date_embauche: new Date('2020-09-01'),
          heures_contractuelles_hebdo: 1800, // 30 heures
          heures_max_journalieres: 480,
          cours_consecutifs_max: 4,
          preference_horaire: 'matin',
          multi_sites: false,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '99999999-9999-9999-9999-999999999999',
          utilisateur_id: '66666666-6666-6666-6666-666666666666',
          etablissement_id: etablissementId,
          matricule: 'ENS002',
          statut: StatutProfessionnel.TITULAIRE,
          date_embauche: new Date('2019-09-01'),
          heures_contractuelles_hebdo: 1500, // 25 heures
          heures_max_journalieres: 420,
          cours_consecutifs_max: 3,
          preference_horaire: 'apres_midi',
          multi_sites: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      await queryInterface.bulkInsert('enseignants', enseignants, { transaction });
      console.log('✅ Enseignants de test créés');

      // 4. Création des classes
      const classes = [
        {
          id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          etablissement_id: etablissementId,
          nom_classe: 'Seconde A',
          niveau: 'Seconde',
          filiere: 'Générale',
          effectif: 32,
          annee_scolaire: '2024-2025',
          salle_principale: 'Salle 101',
          statut: StatutClasse.ACTIVE,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          etablissement_id: etablissementId,
          nom_classe: 'Première S',
          niveau: 'Première',
          filiere: 'Scientifique',
          effectif: 28,
          annee_scolaire: '2024-2025',
          salle_principale: 'Salle 201',
          statut: StatutClasse.ACTIVE,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          etablissement_id: etablissementId,
          nom_classe: 'Terminale ES',
          niveau: 'Terminale',
          filiere: 'Économique et Social',
          effectif: 30,
          annee_scolaire: '2024-2025',
          salle_principale: 'Salle 301',
          statut: StatutClasse.ACTIVE,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      await queryInterface.bulkInsert('classes', classes, { transaction });
      console.log('✅ Classes de test créées');

      // 5. Création des matières
      const matieres = [
        {
          id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
          etablissement_id: etablissementId,
          nom_matiere: 'Mathématiques',
          code_matiere: 'MATH',
          categorie: CategorieMatiere.FONDAMENTALE,
          coefficient: 5.0,
          couleur_affichage: '#EF4444',
          type_cours: TypeCours.COURS_MAGISTRAL,
          duree_standard: 55,
          necessite_equipement_special: false,
          peut_etre_en_ligne: true,
          volume_horaire_hebdo: 220,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
          etablissement_id: etablissementId,
          nom_matiere: 'Français',
          code_matiere: 'FRAN',
          categorie: CategorieMatiere.FONDAMENTALE,
          coefficient: 4.0,
          couleur_affichage: '#3B82F6',
          type_cours: TypeCours.COURS_MAGISTRAL,
          duree_standard: 55,
          necessite_equipement_special: false,
          peut_etre_en_ligne: true,
          volume_horaire_hebdo: 200,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
          etablissement_id: etablissementId,
          nom_matiere: 'Physique-Chimie',
          code_matiere: 'PHYS',
          categorie: CategorieMatiere.FONDAMENTALE,
          coefficient: 4.0,
          couleur_affichage: '#10B981',
          type_cours: TypeCours.TP,
          duree_standard: 110,
          necessite_equipement_special: true,
          peut_etre_en_ligne: false,
          volume_horaire_hebdo: 180,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'gggggggg-gggg-gggg-gggg-gggggggggggg',
          etablissement_id: etablissementId,
          nom_matiere: 'Histoire-Géographie',
          code_matiere: 'HIST',
          categorie: CategorieMatiere.COMPLEMENTAIRE,
          coefficient: 3.0,
          couleur_affichage: '#F59E0B',
          type_cours: TypeCours.COURS_MAGISTRAL,
          duree_standard: 55,
          necessite_equipement_special: false,
          peut_etre_en_ligne: true,
          volume_horaire_hebdo: 150,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh',
          etablissement_id: etablissementId,
          nom_matiere: 'Anglais',
          code_matiere: 'ANGL',
          categorie: CategorieMatiere.COMPLEMENTAIRE,
          coefficient: 2.0,
          couleur_affichage: '#8B5CF6',
          type_cours: TypeCours.TD,
          duree_standard: 55,
          necessite_equipement_special: false,
          peut_etre_en_ligne: true,
          volume_horaire_hebdo: 120,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      await queryInterface.bulkInsert('matieres', matieres, { transaction });
      console.log('✅ Matières de test créées');

      // 6. Liaison enseignants-matieres
      const enseignantsMatieres = [
        {
          enseignant_id: '88888888-8888-8888-8888-888888888888',
          matiere_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', // Mathématiques
        },
        {
          enseignant_id: '88888888-8888-8888-8888-888888888888',
          matiere_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', // Physique
        },
        {
          enseignant_id: '99999999-9999-9999-9999-999999999999',
          matiere_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', // Français
        },
        {
          enseignant_id: '99999999-9999-9999-9999-999999999999',
          matiere_id: 'gggggggg-gggg-gggg-gggg-gggggggggggg', // Histoire
        },
        {
          enseignant_id: '99999999-9999-9999-9999-999999999999',
          matiere_id: 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', // Anglais
        }
      ];

      await queryInterface.bulkInsert('enseignants_matieres', enseignantsMatieres, { transaction });
      console.log('✅ Liaisons enseignants-matieres créées');

      // 7. Création des salles
      const salles = [
        {
          id: 'nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn',
          etablissement_id: etablissementId,
          nom_salle: 'Salle 101',
          batiment: 'Bâtiment A',
          etage: '1',
          type_salle: TypeSalle.STANDARD,
          capacite: 35,
          surface: 50.0,
          accessibilite_pmr: true,
          statut: StatutSalle.DISPONIBLE,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'oooooooo-oooo-oooo-oooo-oooooooooooo',
          etablissement_id: etablissementId,
          nom_salle: 'Salle 201',
          batiment: 'Bâtiment A',
          etage: '2',
          type_salle: TypeSalle.STANDARD,
          capacite: 32,
          surface: 48.0,
          accessibilite_pmr: true,
          statut: StatutSalle.DISPONIBLE,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'pppppppp-pppp-pppp-pppp-pppppppppppp',
          etablissement_id: etablissementId,
          nom_salle: 'Laboratoire Physique',
          batiment: 'Bâtiment B',
          etage: '1',
          type_salle: TypeSalle.LABORATOIRE,
          capacite: 24,
          surface: 60.0,
          accessibilite_pmr: true,
          statut: StatutSalle.DISPONIBLE,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq',
          etablissement_id: etablissementId,
          nom_salle: 'Salle Informatique',
          batiment: 'Bâtiment C',
          etage: '1',
          type_salle: TypeSalle.INFORMATIQUE,
          capacite: 25,
          surface: 55.0,
          accessibilite_pmr: true,
          statut: StatutSalle.DISPONIBLE,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr',
          etablissement_id: etablissementId,
          nom_salle: 'Gymnase Principal',
          batiment: 'Bâtiment D',
          etage: '0',
          type_salle: TypeSalle.GYMNASE,
          capacite: 100,
          surface: 400.0,
          accessibilite_pmr: true,
          statut: StatutSalle.DISPONIBLE,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      await queryInterface.bulkInsert('salles', salles, { transaction });
      console.log('✅ Salles de test créées');

      // 8. Création des cours
      const cours = [
        // Cours pour Seconde A
        {
          id: 'ssssssss-ssss-ssss-ssss-ssssssssssss',
          classe_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          matiere_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', // Mathématiques
          enseignant_id: '88888888-8888-8888-8888-888888888888',
          salle_id: 'nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn', // Salle 101
          volume_horaire_hebdo: 220,
          duree_seance_standard: 55,
          type_cours: TypeCours.COURS_MAGISTRAL,
          enseignement_en_ligne: false,
          effectif_max: 32,
          couleur_affichage: '#EF4444',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'tttttttt-tttt-tttt-tttt-tttttttttttt',
          classe_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          matiere_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', // Français
          enseignant_id: '99999999-9999-9999-9999-999999999999',
          salle_id: 'nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn', // Salle 101
          volume_horaire_hebdo: 200,
          duree_seance_standard: 55,
          type_cours: TypeCours.COURS_MAGISTRAL,
          enseignement_en_ligne: false,
          effectif_max: 32,
          couleur_affichage: '#3B82F6',
          created_at: new Date(),
          updated_at: new Date()
        },
        // Cours pour Première S
        {
          id: 'uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu',
          classe_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          matiere_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', // Physique
          enseignant_id: '88888888-8888-8888-8888-888888888888',
          salle_id: 'pppppppp-pppp-pppp-pppp-pppppppppppp', // Labo Physique
          volume_horaire_hebdo: 180,
          duree_seance_standard: 110,
          type_cours: TypeCours.TP,
          enseignement_en_ligne: false,
          effectif_max: 24,
          couleur_affichage: '#10B981',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvvv',
          classe_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          matiere_id: 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', // Anglais
          enseignant_id: '99999999-9999-9999-9999-999999999999',
          salle_id: 'oooooooo-oooo-oooo-oooo-oooooooooooo', // Salle 201
          volume_horaire_hebdo: 120,
          duree_seance_standard: 55,
          type_cours: TypeCours.TD,
          enseignement_en_ligne: false,
          effectif_max: 28,
          couleur_affichage: '#8B5CF6',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      await queryInterface.bulkInsert('cours', cours, { transaction });
      console.log('✅ Cours de test créés');

      // 9. Création des disponibilités
      const disponibilites = [
        {
          id: 'wwwwwwww-wwww-wwww-wwww-wwwwwwwwwwww',
          enseignant_id: '88888888-8888-8888-8888-888888888888',
          jour_semaine: JourSemaine.LUNDI,
          heure_debut: '08:00:00',
          heure_fin: '18:00:00',
          type: TypeDisponibilite.DISPONIBLE,
          recurrent: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          enseignant_id: '88888888-8888-8888-8888-888888888888',
          jour_semaine: JourSemaine.MARDI,
          heure_debut: '08:00:00',
          heure_fin: '18:00:00',
          type: TypeDisponibilite.DISPONIBLE,
          recurrent: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
          enseignant_id: '88888888-8888-8888-8888-888888888888',
          jour_semaine: JourSemaine.MERCREDI,
          heure_debut: '14:00:00',
          heure_fin: '18:00:00',
          type: TypeDisponibilite.INDISPONIBLE,
          recurrent: true,
          motif: 'Réunion pédagogique',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz',
          enseignant_id: '99999999-9999-9999-9999-999999999999',
          jour_semaine: JourSemaine.LUNDI,
          heure_debut: '08:00:00',
          heure_fin: '18:00:00',
          type: TypeDisponibilite.DISPONIBLE,
          recurrent: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '11111111-1111-1111-1111-111111111112',
          enseignant_id: '99999999-9999-9999-9999-999999999999',
          jour_semaine: JourSemaine.VENDREDI,
          heure_debut: '16:00:00',
          heure_fin: '18:00:00',
          type: TypeDisponibilite.PREFERENCE,
          recurrent: true,
          motif: 'Préférence pour fin de semaine',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      await queryInterface.bulkInsert('disponibilites', disponibilites, { transaction });
      console.log('✅ Disponibilités de test créées');

      // 10. Création d'un emploi du temps exemple
      const emploiTempsId = '22222222-2222-2222-2222-222222222223';
      
      await queryInterface.bulkInsert('emplois_du_temps', [{
        id: emploiTempsId,
        etablissement_id: etablissementId,
        classe_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // Seconde A
        nom_version: 'EDT Seconde A - Semaine type',
        periode_debut: new Date('2024-09-02'),
        periode_fin: new Date('2024-12-20'),
        statut: StatutEmploiTemps.PUBLIE,
        score_qualite: 85.5,
        date_generation: new Date(),
        duree_generation: 120,
        generateur_id: '44444444-4444-4444-4444-444444444444', // Responsable pédagogique
        mode_generation: 'equilibre',
        parametres_generation: JSON.stringify({
          priorite_eleves: 0.6,
          priorite_enseignants: 0.3,
          priorite_salles: 0.1
        }),
        date_publication: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }], { transaction });

      console.log('✅ Emploi du temps de test créé');

      // 11. Création de créneaux exemple
      const creneaux = [
        // Lundi - Mathématiques
        {
          id: '33333333-3333-3333-3333-333333333334',
          emploi_temps_id: emploiTempsId,
          cours_id: 'ssssssss-ssss-ssss-ssss-ssssssssssss', // Maths Seconde A
          salle_id: 'nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn', // Salle 101
          jour_semaine: JourSemaine.LUNDI,
          heure_debut: '08:00:00',
          heure_fin: '09:00:00',
          date_debut_validite: new Date('2024-09-02'),
          date_fin_validite: new Date('2024-12-20'),
          statut: 'confirme',
          created_at: new Date(),
          updated_at: new Date()
        },
        // Lundi - Français
        {
          id: '44444444-4444-4444-4444-444444444445',
          emploi_temps_id: emploiTempsId,
          cours_id: 'tttttttt-tttt-tttt-tttt-tttttttttttt', // Français Seconde A
          salle_id: 'nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn', // Salle 101
          jour_semaine: JourSemaine.LUNDI,
          heure_debut: '10:00:00',
          heure_fin: '11:00:00',
          date_debut_validite: new Date('2024-09-02'),
          date_fin_validite: new Date('2024-12-20'),
          statut: 'confirme',
          created_at: new Date(),
          updated_at: new Date()
        },
        // Mardi - Mathématiques
        {
          id: '55555555-5555-5555-5555-555555555556',
          emploi_temps_id: emploiTempsId,
          cours_id: 'ssssssss-ssss-ssss-ssss-ssssssssssss', // Maths Seconde A
          salle_id: 'nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn', // Salle 101
          jour_semaine: JourSemaine.MARDI,
          heure_debut: '14:00:00',
          heure_fin: '15:00:00',
          date_debut_validite: new Date('2024-09-02'),
          date_fin_validite: new Date('2024-12-20'),
          statut: 'confirme',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      await queryInterface.bulkInsert('creneaux_cours', creneaux, { transaction });
      console.log('✅ Créneaux de test créés');

      // 12. Création d'un rattrapage exemple
      await queryInterface.bulkInsert('rattrapages', [{
        id: '66666666-6666-6666-6666-666666666667',
        cours_id: 'ssssssss-ssss-ssss-ssss-ssssssssssss', // Maths Seconde A
        type_rattrapage: TypeRattrapage.COURS_ANNULE,
        date_demande: new Date(),
        duree: 55,
        eleves_concernes: JSON.stringify(['tous']),
        statut: StatutRattrapage.PLANIFIE,
        motif: 'Absence enseignant pour raison médicale',
        periode_souhaitee_debut: new Date('2024-09-10'),
        periode_souhaitee_fin: new Date('2024-09-17'),
        creneau_planifie_id: '55555555-5555-5555-5555-555555555556',
        date_planification: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }], { transaction });

      console.log('✅ Rattrapage de test créé');

      await transaction.commit();
      
      console.log('🎉 Seeding terminé avec succès!');
      console.log('');
      console.log('📋 DONNÉES DE TEST CRÉÉES:');
      console.log('   • 1 Établissement: Lycée Victor Hugo');
      console.log('   • 6 Utilisateurs (Admin, Directeur, Responsable, 2 Enseignants, Étudiant)');
      console.log('   • 3 Classes (Seconde A, Première S, Terminale ES)');
      console.log('   • 5 Matières (Maths, Français, Physique, Histoire, Anglais)');
      console.log('   • 5 Salles (Standard, Laboratoire, Informatique, Gymnase)');
      console.log('   • 4 Cours avec enseignants assignés');
      console.log('   • 1 Emploi du temps publié avec créneaux');
      console.log('   • 1 Rattrapage planifié');
      console.log('');
      console.log('🔐 COMPTES DE TEST:');
      console.log('   Email: admin@edt-generator.com');
      console.log('   Email: directeur@lycee-victor-hugo.fr');
      console.log('   Email: pedagogique@lycee-victor-hugo.fr');
      console.log('   Email: dupont@lycee-victor-hugo.fr');
      console.log('   Mot de passe: Password123!');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Erreur lors du seeding:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🗑️  Nettoyage des données de test...');
      
      // Suppression dans l'ordre inverse des dépendances
      await queryInterface.bulkDelete('rattrapages', null, { transaction });
      await queryInterface.bulkDelete('creneaux_cours', null, { transaction });
      await queryInterface.bulkDelete('emplois_du_temps', null, { transaction });
      await queryInterface.bulkDelete('disponibilites', null, { transaction });
      await queryInterface.bulkDelete('cours', null, { transaction });
      await queryInterface.bulkDelete('enseignants_matieres', null, { transaction });
      await queryInterface.bulkDelete('salles', null, { transaction });
      await queryInterface.bulkDelete('matieres', null, { transaction });
      await queryInterface.bulkDelete('classes', null, { transaction });
      await queryInterface.bulkDelete('enseignants', null, { transaction });
      await queryInterface.bulkDelete('utilisateurs', null, { transaction });
      await queryInterface.bulkDelete('etablissements', null, { transaction });

      await transaction.commit();
      console.log('🗑️  Toutes les données de test ont été supprimées');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Erreur lors du nettoyage:', error);
      throw error;
    }
  }
};