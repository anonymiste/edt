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
  StatutConnexion,
  TypeOperation,
  CategorieContrainte,
  PrioriteContrainte,
  TypeConflit,
  SeveriteConflit,
  ModeGeneration,
  NiveauFlexibilite,
  FormatExport
} = require('../../utils/enums');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🚀 Début de la création des tables...');

    // Table des établissements
    await queryInterface.createTable('etablissements', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      nom: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM(...Object.values(TypeEtablissement)),
        allowNull: false
      },
      adresse: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ville: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      code_postal: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      telephone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true,
        validate: {
          isEmail: true
        }
      },
      site_web: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      logo_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      code_acces: {
        type: Sequelize.STRING(16),
        allowNull: false,
        unique: true
      },
      fuseau_horaire: {
        type: Sequelize.STRING(50),
        defaultValue: 'Europe/Paris'
      },
      langue: {
        type: Sequelize.STRING(2),
        defaultValue: 'fr'
      },
      annee_scolaire_courante: {
        type: Sequelize.STRING(9),
        allowNull: false,
        validate: {
          is: /^\d{4}-\d{4}$/
        }
      },
      statut: {
        type: Sequelize.ENUM('actif', 'inactif', 'suspendu'),
        defaultValue: 'actif'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    console.log('✅ Table etablissements créée');

    // Table des utilisateurs
    await queryInterface.createTable('utilisateurs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      mot_de_passe_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      nom: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      prenom: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      telephone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      photo_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      role: {
        type: Sequelize.ENUM(...Object.values(RoleUtilisateur)),
        allowNull: false
      },
      etablissement_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'etablissements',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      deux_fa_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      deux_fa_secret: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      date_derniere_connexion: {
        type: Sequelize.DATE,
        allowNull: true
      },
      actif: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    console.log('✅ Table utilisateurs créée');

    // Table des classes
    await queryInterface.createTable('classes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      etablissement_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'etablissements',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      nom_classe: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      niveau: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      filiere: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      effectif: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 500
        }
      },
      annee_scolaire: {
        type: Sequelize.STRING(9),
        allowNull: false
      },
      salle_principale: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      statut: {
        type: Sequelize.ENUM(...Object.values(StatutClasse)),
        defaultValue: StatutClasse.ACTIVE
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    console.log('✅ Table classes créée');

    // Table des matières
    await queryInterface.createTable('matieres', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      etablissement_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'etablissements',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      nom_matiere: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      code_matiere: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      categorie: {
        type: Sequelize.ENUM(...Object.values(CategorieMatiere)),
        allowNull: false
      },
      coefficient: {
        type: Sequelize.FLOAT,
        defaultValue: 1.0
      },
      couleur_affichage: {
        type: Sequelize.STRING(7),
        defaultValue: '#3B82F6'
      },
      type_cours: {
        type: Sequelize.ENUM(...Object.values(TypeCours)),
        allowNull: false
      },
      duree_standard: {
        type: Sequelize.INTEGER, // en minutes
        allowNull: false
      },
      necessite_equipement_special: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      peut_etre_en_ligne: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      volume_horaire_hebdo: {
        type: Sequelize.INTEGER, // en minutes par semaine
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    console.log('✅ Table matieres créée');

    // Table des enseignants
    await queryInterface.createTable('enseignants', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      utilisateur_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'utilisateurs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      etablissement_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'etablissements',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      matricule: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      statut: {
        type: Sequelize.ENUM(...Object.values(StatutProfessionnel)),
        allowNull: false
      },
      date_embauche: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      heures_contractuelles_hebdo: {
        type: Sequelize.INTEGER, // en minutes
        allowNull: false
      },
      heures_max_journalieres: {
        type: Sequelize.INTEGER,
        defaultValue: 480 // 8 heures
      },
      cours_consecutifs_max: {
        type: Sequelize.INTEGER,
        defaultValue: 4
      },
      preference_horaire: {
        type: Sequelize.ENUM('matin', 'apres_midi', 'indifferent'),
        defaultValue: 'indifferent'
      },
      multi_sites: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    console.log('✅ Table enseignants créée');

    // Table de liaison enseignants-matieres
    await queryInterface.createTable('enseignants_matieres', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      enseignant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'enseignants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      matiere_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'matieres',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    console.log('✅ Table enseignants_matieres créée');

    // Table des salles
    await queryInterface.createTable('salles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      etablissement_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'etablissements',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      nom_salle: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      batiment: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      etage: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      type_salle: {
        type: Sequelize.ENUM(...Object.values(TypeSalle)),
        allowNull: false
      },
      capacite: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 1000
        }
      },
      surface: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      accessibilite_pmr: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      statut: {
        type: Sequelize.ENUM(...Object.values(StatutSalle)),
        defaultValue: StatutSalle.DISPONIBLE
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    console.log('✅ Table salles créée');

    // Table des cours
    await queryInterface.createTable('cours', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      classe_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'classes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      matiere_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'matieres',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      enseignant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'enseignants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      salle_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'salles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      volume_horaire_hebdo: {
        type: Sequelize.INTEGER, // en minutes
        allowNull: false
      },
      duree_seance_standard: {
        type: Sequelize.INTEGER, // en minutes
        allowNull: false
      },
      type_cours: {
        type: Sequelize.ENUM(...Object.values(TypeCours)),
        allowNull: false
      },
      enseignement_en_ligne: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      effectif_max: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      couleur_affichage: {
        type: Sequelize.STRING(7),
        allowNull: true
      },
      groupe_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    console.log('✅ Table cours créée');

    // Table des emplois du temps
    await queryInterface.createTable('emplois_du_temps', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      etablissement_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'etablissements',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      classe_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'classes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      nom_version: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      periode_debut: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      periode_fin: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      statut: {
        type: Sequelize.ENUM(...Object.values(StatutEmploiTemps)),
        defaultValue: StatutEmploiTemps.BROUILLON
      },
      score_qualite: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      date_generation: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      duree_generation: {
        type: Sequelize.INTEGER, // en secondes
        defaultValue: 0
      },
      generateur_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'utilisateurs',
          key: 'id'
        }
      },
      mode_generation: {
        type: Sequelize.ENUM(...Object.values(ModeGeneration)),
        defaultValue: ModeGeneration.EQUILIBRE
      },
      parametres_generation: {
        type: Sequelize.JSON,
        allowNull: true
      },
      commentaires: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      date_validation: {
        type: Sequelize.DATE,
        allowNull: true
      },
      date_publication: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    console.log('✅ Table emplois_du_temps créée');

    // Table des créneaux de cours
    await queryInterface.createTable('creneaux_cours', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      emploi_temps_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'emplois_du_temps',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      cours_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'cours',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      salle_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'salles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      jour_semaine: {
        type: Sequelize.ENUM(...Object.values(JourSemaine)),
        allowNull: false
      },
      heure_debut: {
        type: Sequelize.TIME,
        allowNull: false
      },
      heure_fin: {
        type: Sequelize.TIME,
        allowNull: false
      },
      date_debut_validite: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      date_fin_validite: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      sequence_type: {
        type: Sequelize.STRING(1), // A/B pour alternance
        allowNull: true
      },
      est_rattrapage: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      statut: {
        type: Sequelize.ENUM('planifie', 'confirme', 'annule'),
        defaultValue: 'planifie'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    console.log('✅ Table creneaux_cours créée');

    // Table des rattrapages
    await queryInterface.createTable('rattrapages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      cours_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'cours',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type_rattrapage: {
        type: Sequelize.ENUM(...Object.values(TypeRattrapage)),
        allowNull: false
      },
      date_demande: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      duree: {
        type: Sequelize.INTEGER, // en minutes
        allowNull: false
      },
      eleves_concernes: {
        type: Sequelize.JSON, // liste des élèves ou "tous"
        allowNull: false
      },
      statut: {
        type: Sequelize.ENUM(...Object.values(StatutRattrapage)),
        defaultValue: StatutRattrapage.DEMANDE
      },
      motif: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      periode_souhaitee_debut: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      periode_souhaitee_fin: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      creneau_planifie_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'creneaux_cours',
          key: 'id'
        }
      },
      date_planification: {
        type: Sequelize.DATE,
        allowNull: true
      },
      date_realisation: {
        type: Sequelize.DATE,
        allowNull: true
      },
      commentaires: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    console.log('✅ Table rattrapages créée');

    // Table des absences
    await queryInterface.createTable('absences', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      enseignant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'enseignants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      cours_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'cours',
          key: 'id'
        }
      },
      date_debut: {
        type: Sequelize.DATE,
        allowNull: false
      },
      date_fin: {
        type: Sequelize.DATE,
        allowNull: false
      },
      motif: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      statut: {
        type: Sequelize.ENUM(...Object.values(StatutAbsence)),
        defaultValue: StatutAbsence.DECLAREE
      },
      necessite_remplacement: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      cours_concernes: {
        type: Sequelize.JSON, // liste des cours impactés
        allowNull: true
      },
      date_declaration: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      rattrapages: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    console.log('✅ Table absences créée');

    // Table des disponibilités
    await queryInterface.createTable('disponibilites', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      enseignant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'enseignants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      jour_semaine: {
        type: Sequelize.ENUM(...Object.values(JourSemaine)),
        allowNull: false
      },
      heure_debut: {
        type: Sequelize.TIME,
        allowNull: false
      },
      heure_fin: {
        type: Sequelize.TIME,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM(...Object.values(TypeDisponibilite)),
        allowNull: false
      },
      recurrent: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      date_debut: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      date_fin: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      motif: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    console.log('✅ Table disponibilites créée');

    // Table des contraintes
    await queryInterface.createTable('contraintes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      etablissement_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'etablissements',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      nom: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM(...Object.values(TypeContrainte)),
        allowNull: false
      },
      categorie: {
        type: Sequelize.ENUM(...Object.values(CategorieContrainte)),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      poids: {
        type: Sequelize.FLOAT, // pour contraintes souples
        defaultValue: 1.0
      },
      severite: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      priorite: {
        type: Sequelize.ENUM(...Object.values(PrioriteContrainte)),
        defaultValue: PrioriteContrainte.MOYENNE
      },
      parametres: {
        type: Sequelize.JSON,
        allowNull: true
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    console.log('✅ Table contraintes créée');

    // Table des notifications
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      utilisateur_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'utilisateurs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM(...Object.values(TypeNotification)),
        allowNull: false
      },
      titre: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      lien_action: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      lue: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      date_envoi: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      canal: {
        type: Sequelize.ENUM(...Object.values(CanalNotification)),
        defaultValue: CanalNotification.IN_APP
      },
      priorite: {
        type: Sequelize.ENUM(...Object.values(PrioriteNotification)),
        defaultValue: PrioriteNotification.NORMALE
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    console.log('✅ Table notifications créée');

    // Table des logs de connexion
    await queryInterface.createTable('logs_connexion', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      utilisateur_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'utilisateurs',
          key: 'id'
        }
      },
      date_heure: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      adresse_ip: {
        type: Sequelize.STRING(45),
        allowNull: false
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      statut: {
        type: Sequelize.ENUM(...Object.values(StatutConnexion)),
        allowNull: false
      },
      mot_de_passe_tente: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      pays: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      ville: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    console.log('✅ Table logs_connexion créée');

    // Table des logs de modification
    await queryInterface.createTable('logs_modification', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      utilisateur_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'utilisateurs',
          key: 'id'
        }
      },
      table_concernee: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      id_entite_concernee: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      type_operation: {
        type: Sequelize.ENUM(...Object.values(TypeOperation)),
        allowNull: false
      },
      valeur_avant: {
        type: Sequelize.JSON,
        allowNull: true
      },
      valeur_apres: {
        type: Sequelize.JSON,
        allowNull: true
      },
      date_heure: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      adresse_ip: {
        type: Sequelize.STRING(45),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    console.log('✅ Table logs_modification créée');

    // Création des index pour les performances
    await queryInterface.addIndex('utilisateurs', ['email']);
    await queryInterface.addIndex('utilisateurs', ['etablissement_id']);
    await queryInterface.addIndex('utilisateurs', ['role']);
    
    await queryInterface.addIndex('classes', ['etablissement_id']);
    await queryInterface.addIndex('classes', ['niveau']);
    await queryInterface.addIndex('classes', ['statut']);
    
    await queryInterface.addIndex('matieres', ['etablissement_id']);
    await queryInterface.addIndex('matieres', ['code_matiere']);
    
    await queryInterface.addIndex('enseignants', ['utilisateur_id']);
    await queryInterface.addIndex('enseignants', ['etablissement_id']);
    await queryInterface.addIndex('enseignants', ['matricule']);
    
    await queryInterface.addIndex('salles', ['etablissement_id']);
    await queryInterface.addIndex('salles', ['type_salle']);
    
    await queryInterface.addIndex('cours', ['classe_id']);
    await queryInterface.addIndex('cours', ['matiere_id']);
    await queryInterface.addIndex('cours', ['enseignant_id']);
    
    await queryInterface.addIndex('emplois_du_temps', ['etablissement_id']);
    await queryInterface.addIndex('emplois_du_temps', ['classe_id']);
    await queryInterface.addIndex('emplois_du_temps', ['statut']);
    
    await queryInterface.addIndex('creneaux_cours', ['emploi_temps_id']);
    await queryInterface.addIndex('creneaux_cours', ['cours_id']);
    await queryInterface.addIndex('creneaux_cours', ['salle_id']);
    await queryInterface.addIndex('creneaux_cours', ['jour_semaine', 'heure_debut', 'heure_fin']);
    
    await queryInterface.addIndex('rattrapages', ['cours_id']);
    await queryInterface.addIndex('rattrapages', ['statut']);
    
    await queryInterface.addIndex('absences', ['enseignant_id']);
    await queryInterface.addIndex('absences', ['date_debut', 'date_fin']);
    
    await queryInterface.addIndex('disponibilites', ['enseignant_id']);
    await queryInterface.addIndex('disponibilites', ['jour_semaine']);
    
    await queryInterface.addIndex('contraintes', ['etablissement_id']);
    await queryInterface.addIndex('contraintes', ['type']);
    
    await queryInterface.addIndex('notifications', ['utilisateur_id']);
    await queryInterface.addIndex('notifications', ['lue']);
    
    await queryInterface.addIndex('logs_connexion', ['utilisateur_id']);
    await queryInterface.addIndex('logs_connexion', ['date_heure']);
    
    await queryInterface.addIndex('logs_modification', ['utilisateur_id']);
    await queryInterface.addIndex('logs_modification', ['table_concernee']);

    console.log('✅ Index créés');

    console.log('🎉 Migration terminée avec succès!');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🗑️  Suppression des tables...');
    
    // Suppression dans l'ordre inverse des dépendances
    await queryInterface.dropTable('logs_modification');
    await queryInterface.dropTable('logs_connexion');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('contraintes');
    await queryInterface.dropTable('disponibilites');
    await queryInterface.dropTable('absences');
    await queryInterface.dropTable('rattrapages');
    await queryInterface.dropTable('creneaux_cours');
    await queryInterface.dropTable('emplois_du_temps');
    await queryInterface.dropTable('cours');
    await queryInterface.dropTable('enseignants_matieres');
    await queryInterface.dropTable('salles');
    await queryInterface.dropTable('enseignants');
    await queryInterface.dropTable('matieres');
    await queryInterface.dropTable('classes');
    await queryInterface.dropTable('utilisateurs');
    await queryInterface.dropTable('etablissements');

    console.log('🗑️  Toutes les tables ont été supprimées');
  }
};