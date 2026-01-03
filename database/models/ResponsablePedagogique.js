const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const ResponsablePedagogique = sequelize.define('ResponsablePedagogique', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    utilisateur_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true
        }
    },
    etablissement_id: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    matricule: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [1, 50]
        }
    },
    date_prise_fonction: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: true
        }
    }
}, {
    tableName: 'responsables_pedagogiques',
    hooks: {
        beforeUpdate: (rp) => {
            rp.updated_at = new Date();
        }
    },
    indexes: [
        {
            fields: ['utilisateur_id']
        },
        {
            fields: ['etablissement_id']
        },
        {
            fields: ['matricule']
        }
    ]
});

module.exports = ResponsablePedagogique;
