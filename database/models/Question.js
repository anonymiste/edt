const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Question = sequelize.define('Question', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    examen_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('QCM', 'VRAI_FAUX', 'TEXTE_LIBRE'),
        defaultValue: 'QCM'
    },
    enonce: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    points: {
        type: DataTypes.FLOAT,
        defaultValue: 1.0
    },
    ordre: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Ordre d\'affichage de la question'
    },
    options: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Pour QCM: [{texte: "...", correct: true/false}, ...]'
    },
    reponse_correcte: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Pour VRAI_FAUX ou texte de référence'
    }
}, {
    tableName: 'questions',
    indexes: [
        {
            fields: ['examen_id']
        },
        {
            fields: ['ordre']
        }
    ]
});

module.exports = Question;
