const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const SessionExamen = sequelize.define('SessionExamen', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    titre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    matiere_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    classe_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    date_examen: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    heure_debut: {
        type: DataTypes.TIME,
        allowNull: false
    },
    heure_fin: {
        type: DataTypes.TIME,
        allowNull: false
    },
    duree_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('DEVOIR_SURVEILLE', 'COMPOSITION', 'EXAMEN_BLANC', 'CONTROLE_CONTINU'),
        defaultValue: 'DEVOIR_SURVEILLE'
    },
    coefficient: {
        type: DataTypes.FLOAT,
        defaultValue: 1.0
    },
    instructions: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    statut: {
        type: DataTypes.ENUM('PLANIFIE', 'EN_COURS', 'TERMINE', 'ANNULE'),
        defaultValue: 'PLANIFIE'
    },
    session_examen_originale_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'ID de la session d\'examen originale si c\'est un rattrapage'
    }
}, {
    tableName: 'sessions_examen',
    indexes: [
        {
            fields: ['date_examen']
        },
        {
            fields: ['classe_id']
        },
        {
            fields: ['matiere_id']
        },
        {
            fields: ['statut']
        }
    ]
});

module.exports = SessionExamen;
