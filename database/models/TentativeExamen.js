const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const TentativeExamen = sequelize.define('TentativeExamen', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    examen_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    eleve_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    date_debut: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    date_fin: {
        type: DataTypes.DATE,
        allowNull: true
    },
    note_obtenue: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    statut: {
        type: DataTypes.ENUM('EN_COURS', 'SOUMIS', 'CORRIGE'),
        defaultValue: 'EN_COURS'
    }
}, {
    tableName: 'tentatives_examens',
    indexes: [
        {
            fields: ['examen_id']
        },
        {
            fields: ['eleve_id']
        }
    ]
});

module.exports = TentativeExamen;
