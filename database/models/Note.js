const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Note = sequelize.define('Note', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    evaluation_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    eleve_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    valeur: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    appreciation: {
        type: DataTypes.STRING,
        allowNull: true
    },
    absent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'notes',
    indexes: [
        {
            fields: ['evaluation_id']
        },
        {
            fields: ['eleve_id']
        },
        {
            unique: true,
            fields: ['evaluation_id', 'eleve_id']
        }
    ]
});

module.exports = Note;
