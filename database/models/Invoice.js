const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const { StatutInvoice } = require('../../utils/enums');

const Invoice = sequelize.define('Invoice', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    etablissement_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'etablissements',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    subscription_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'subscriptions',
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    numero_facture: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Format: INV-YYYY-MM-XXXXX'
    },
    periode_debut: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    periode_fin: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    montant_ht: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
            min: 0
        }
    },
    taux_tva: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 18.00,
        comment: 'Taux de TVA en pourcentage'
    },
    montant_tva: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
            min: 0
        }
    },
    montant_ttc: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
            min: 0
        }
    },
    statut: {
        type: DataTypes.ENUM(...Object.values(StatutInvoice)),
        allowNull: false,
        defaultValue: StatutInvoice.PENDING,
        validate: {
            isIn: [Object.values(StatutInvoice)]
        }
    },
    date_emission: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    date_echeance: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    date_paiement: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    mode_paiement: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Ex: Carte bancaire, Virement, Espèces'
    },
    reference_paiement: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Référence de transaction'
    },
    details_json: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Détails des lignes de facturation'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'invoices',
    hooks: {
        beforeCreate: (invoice) => {
            // Générer le numéro de facture si non fourni
            if (!invoice.numero_facture) {
                const date = new Date();
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const random = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
                invoice.numero_facture = `INV-${year}-${month}-${random}`;
            }

            // Calculer la TVA et le TTC si non fournis
            if (invoice.montant_ht > 0 && invoice.montant_tva === 0) {
                invoice.montant_tva = (invoice.montant_ht * invoice.taux_tva / 100).toFixed(2);
                invoice.montant_ttc = (parseFloat(invoice.montant_ht) + parseFloat(invoice.montant_tva)).toFixed(2);
            }

            // Définir la date d'échéance (30 jours après émission)
            if (!invoice.date_echeance) {
                const echeance = new Date(invoice.date_emission);
                echeance.setDate(echeance.getDate() + 30);
                invoice.date_echeance = echeance;
            }
        },
        beforeUpdate: (invoice) => {
            invoice.updated_at = new Date();

            // Recalculer la TVA et le TTC si le montant HT change
            if (invoice.changed('montant_ht')) {
                invoice.montant_tva = (invoice.montant_ht * invoice.taux_tva / 100).toFixed(2);
                invoice.montant_ttc = (parseFloat(invoice.montant_ht) + parseFloat(invoice.montant_tva)).toFixed(2);
            }
        }
    },
    indexes: [
        {
            fields: ['etablissement_id']
        },
        {
            fields: ['subscription_id']
        },
        {
            fields: ['statut']
        },
        {
            fields: ['date_emission']
        },
        {
            fields: ['date_echeance']
        },
        {
            unique: true,
            fields: ['numero_facture']
        }
    ]
});

// Méthodes d'instance
Invoice.prototype.markAsPaid = function (paymentData = {}) {
    this.statut = StatutInvoice.PAID;
    this.date_paiement = new Date();
    if (paymentData.mode_paiement) {
        this.mode_paiement = paymentData.mode_paiement;
    }
    if (paymentData.reference) {
        this.reference_paiement = paymentData.reference;
    }
    return this.save();
};

Invoice.prototype.isOverdue = function () {
    if (this.statut === StatutInvoice.PAID) return false;
    return new Date() > new Date(this.date_echeance);
};

Invoice.prototype.cancel = function () {
    this.statut = StatutInvoice.CANCELLED;
    return this.save();
};

module.exports = Invoice;
