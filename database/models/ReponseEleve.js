const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const ReponseEleve = sequelize.define('ReponseEleve', {
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
    question_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    reponse: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Réponse de l\'élève (index option pour QCM, texte pour libre)'
    },
    est_correcte: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        comment: 'Null si non corrigé, true/false après correction'
    },
    points_obtenus: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    date_soumission: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'reponses_eleves',
    indexes: [
        {
            fields: ['examen_id']
        },
        {
            fields: ['eleve_id']
        },
        {
            fields: ['question_id']
        },
        {
            unique: true,
            fields: ['examen_id', 'eleve_id', 'question_id']
        }
    ]
});

module.exports = ReponseEleve;
