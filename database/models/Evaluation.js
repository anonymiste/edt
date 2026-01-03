const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Evaluation = sequelize.define('Evaluation', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    titre: {
        type: DataTypes.STRING,
        allowNull: true
    },
    type: {
        type: DataTypes.ENUM('DEVOIR', 'COMPOSITION', 'ORAL', 'TP', 'AUTRE'),
        defaultValue: 'DEVOIR',
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
    enseignant_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    periode_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    coefficient: {
        type: DataTypes.FLOAT,
        defaultValue: 1.0
    },
    note_sur: {
        type: DataTypes.FLOAT,
        defaultValue: 20.0
    },
    date_evaluation: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    publie: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'evaluations',
    indexes: [
        {
            fields: ['classe_id']
        },
        {
            fields: ['matiere_id']
        },
        {
            fields: ['periode_id']
        }
    ]
});

module.exports = Evaluation;
