'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Table des élèves
        await queryInterface.createTable('eleves', {
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
            classe_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'classes',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            matricule: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true
            },
            date_naissance: {
                type: Sequelize.DATEONLY,
                allowNull: true
            },
            adresse: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            }
        });

        // Table des directeurs
        await queryInterface.createTable('directeurs', {
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
            date_nomination: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            }
        });

        // Table des responsables pédagogiques
        await queryInterface.createTable('responsables_pedagogiques', {
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
            date_prise_fonction: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            }
        });

        // Index (Wrapped in try-catch to ignore duplicate key errors if already present)
        try { await queryInterface.addIndex('eleves', ['utilisateur_id']); } catch (e) { }
        try { await queryInterface.addIndex('eleves', ['etablissement_id']); } catch (e) { }
        try { await queryInterface.addIndex('eleves', ['classe_id']); } catch (e) { }
        try { await queryInterface.addIndex('eleves', ['matricule']); } catch (e) { }

        try { await queryInterface.addIndex('directeurs', ['utilisateur_id']); } catch (e) { }
        try { await queryInterface.addIndex('directeurs', ['etablissement_id']); } catch (e) { }
        try { await queryInterface.addIndex('directeurs', ['matricule']); } catch (e) { }

        try { await queryInterface.addIndex('responsables_pedagogiques', ['utilisateur_id']); } catch (e) { }
        try { await queryInterface.addIndex('responsables_pedagogiques', ['etablissement_id']); } catch (e) { }
        try { await queryInterface.addIndex('responsables_pedagogiques', ['matricule']); } catch (e) { }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('responsables_pedagogiques');
        await queryInterface.dropTable('directeurs');
        await queryInterface.dropTable('eleves');
    }
};
