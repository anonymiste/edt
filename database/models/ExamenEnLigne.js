const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const ExamenEnLigne = sequelize.define('ExamenEnLigne', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    titre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    cours_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    enseignant_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    duree_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 60,
        comment: 'Durée de l\'examen en minutes'
    },
    date_ouverture: {
        type: DataTypes.DATE,
        allowNull: false
    },
    date_fermeture: {
        type: DataTypes.DATE,
        allowNull: false
    },
    note_totale: {
        type: DataTypes.FLOAT,
        defaultValue: 20.0
    },
    afficher_resultats: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Afficher les résultats aux étudiants après soumission'
    },
    melanger_questions: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    statut: {
        type: DataTypes.ENUM('BROUILLON', 'PUBLIE', 'ARCHIVE'),
        defaultValue: 'BROUILLON'
    }
}, {
    tableName: 'examens_en_ligne',
    indexes: [
        {
            fields: ['cours_id']
        },
        {
            fields: ['enseignant_id']
        },
        {
            fields: ['date_ouverture', 'date_fermeture']
        }
    ]
});

module.exports = ExamenEnLigne;
