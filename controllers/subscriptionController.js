const { Subscription, Etablissement, UsageMetric } = require('../database/models');
const { PlanType, StatutSubscription } = require('../utils/enums');
const UsageTrackingService = require('../services/usageTrackingService');
const { validationResult } = require('express-validator');

const subscriptionController = {
    /**
     * Obtenir l'abonnement actuel de l'établissement
     */
    getSubscription: async (req, res) => {
        try {
            const etablissementId = req.utilisateur.etablissement_id;

            const subscription = await Subscription.findOne({
                where: {
                    etablissement_id: etablissementId,
                    statut: StatutSubscription.ACTIVE
                },
                include: [{
                    association: 'etablissement',
                    attributes: ['id', 'nom', 'limite_utilisateurs', 'limite_classes', 'limite_stockage_mb']
                }]
            });

            if (!subscription) {
                return res.status(404).json({
                    error: 'Aucun abonnement actif trouvé',
                    code: 'NO_ACTIVE_SUBSCRIPTION'
                });
            }

            res.json({
                subscription,
                code: 'SUBSCRIPTION_RETRIEVED'
            });
        } catch (error) {
            console.error('Erreur récupération abonnement:', error);
            res.status(500).json({
                error: 'Erreur lors de la récupération de l\'abonnement',
                code: 'SUBSCRIPTION_RETRIEVAL_ERROR'
            });
        }
    },

    /**
     * Créer un nouvel abonnement
     */
    createSubscription: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Données invalides',
                    details: errors.array(),
                    code: 'VALIDATION_ERROR'
                });
            }

            const { etablissement_id, plan_type, date_debut } = req.body;

            // Vérifier qu'il n'existe pas déjà un abonnement actif
            const existingSubscription = await Subscription.findOne({
                where: {
                    etablissement_id,
                    statut: StatutSubscription.ACTIVE
                }
            });

            if (existingSubscription) {
                return res.status(409).json({
                    error: 'Un abonnement actif existe déjà',
                    code: 'SUBSCRIPTION_EXISTS'
                });
            }

            const subscription = await Subscription.create({
                etablissement_id,
                plan_type: plan_type || PlanType.TRIAL,
                date_debut: date_debut || new Date()
            });

            // Mettre à jour l'établissement avec les limites selon le plan
            const etablissement = await Etablissement.findByPk(etablissement_id);
            if (etablissement) {
                const limits = {
                    [PlanType.TRIAL]: { users: 5, classes: 2, storage: 500 },
                    [PlanType.BASIC]: { users: 50, classes: 10, storage: 5000 },
                    [PlanType.PREMIUM]: { users: 200, classes: 50, storage: 20000 },
                    [PlanType.ENTERPRISE]: { users: null, classes: null, storage: null }
                };

                const planLimits = limits[subscription.plan_type];
                etablissement.limite_utilisateurs = planLimits.users;
                etablissement.limite_classes = planLimits.classes;
                etablissement.limite_stockage_mb = planLimits.storage;
                etablissement.subscription_id = subscription.id;
                await etablissement.save();
            }

            res.status(201).json({
                message: 'Abonnement créé avec succès',
                subscription,
                code: 'SUBSCRIPTION_CREATED'
            });
        } catch (error) {
            console.error('Erreur création abonnement:', error);
            res.status(500).json({
                error: 'Erreur lors de la création de l\'abonnement',
                code: 'SUBSCRIPTION_CREATION_ERROR'
            });
        }
    },

    /**
     * Mettre à jour un abonnement (upgrade/downgrade)
     */
    updateSubscription: async (req, res) => {
        try {
            const { id } = req.params;
            const { plan_type } = req.body;

            const subscription = await Subscription.findByPk(id);
            if (!subscription) {
                return res.status(404).json({
                    error: 'Abonnement non trouvé',
                    code: 'SUBSCRIPTION_NOT_FOUND'
                });
            }

            // Vérifier que l'utilisateur a accès à cet abonnement
            if (subscription.etablissement_id !== req.utilisateur.etablissement_id && req.utilisateur.role !== 'admin') {
                return res.status(403).json({
                    error: 'Accès non autorisé',
                    code: 'FORBIDDEN'
                });
            }

            const oldPlan = subscription.plan_type;
            subscription.plan_type = plan_type;
            await subscription.save();

            // Mettre à jour les limites de l'établissement
            const etablissement = await Etablissement.findByPk(subscription.etablissement_id);
            if (etablissement) {
                const limits = {
                    [PlanType.TRIAL]: { users: 5, classes: 2, storage: 500 },
                    [PlanType.BASIC]: { users: 50, classes: 10, storage: 5000 },
                    [PlanType.PREMIUM]: { users: 200, classes: 50, storage: 20000 },
                    [PlanType.ENTERPRISE]: { users: null, classes: null, storage: null }
                };

                const planLimits = limits[plan_type];
                etablissement.limite_utilisateurs = planLimits.users;
                etablissement.limite_classes = planLimits.classes;
                etablissement.limite_stockage_mb = planLimits.storage;
                await etablissement.save();
            }

            res.json({
                message: `Abonnement mis à jour de ${oldPlan} vers ${plan_type}`,
                subscription,
                code: 'SUBSCRIPTION_UPDATED'
            });
        } catch (error) {
            console.error('Erreur mise à jour abonnement:', error);
            res.status(500).json({
                error: 'Erreur lors de la mise à jour de l\'abonnement',
                code: 'SUBSCRIPTION_UPDATE_ERROR'
            });
        }
    },

    /**
     * Annuler un abonnement
     */
    cancelSubscription: async (req, res) => {
        try {
            const { id } = req.params;

            const subscription = await Subscription.findByPk(id);
            if (!subscription) {
                return res.status(404).json({
                    error: 'Abonnement non trouvé',
                    code: 'SUBSCRIPTION_NOT_FOUND'
                });
            }

            // Vérifier que l'utilisateur a accès à cet abonnement
            if (subscription.etablissement_id !== req.utilisateur.etablissement_id && req.utilisateur.role !== 'admin') {
                return res.status(403).json({
                    error: 'Accès non autorisé',
                    code: 'FORBIDDEN'
                });
            }

            await subscription.cancel();

            res.json({
                message: 'Abonnement annulé avec succès',
                subscription,
                code: 'SUBSCRIPTION_CANCELLED'
            });
        } catch (error) {
            console.error('Erreur annulation abonnement:', error);
            res.status(500).json({
                error: 'Erreur lors de l\'annulation de l\'abonnement',
                code: 'SUBSCRIPTION_CANCELLATION_ERROR'
            });
        }
    },

    /**
     * Obtenir les statistiques d'utilisation
     */
    getUsageStats: async (req, res) => {
        try {
            const etablissementId = req.utilisateur.etablissement_id;
            const { period } = req.query;

            let periodeDebut, periodeFin;

            if (period === 'current_month') {
                const today = new Date();
                periodeDebut = new Date(today.getFullYear(), today.getMonth(), 1);
                periodeFin = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            } else if (period === 'last_month') {
                const today = new Date();
                periodeDebut = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                periodeFin = new Date(today.getFullYear(), today.getMonth(), 0);
            } else {
                // Par défaut, mois en cours
                const today = new Date();
                periodeDebut = new Date(today.getFullYear(), today.getMonth(), 1);
                periodeFin = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            }

            const metrics = await UsageMetric.findOne({
                where: {
                    etablissement_id: etablissementId,
                    periode_debut: periodeDebut,
                    periode_fin: periodeFin
                },
                order: [['date_capture', 'DESC']]
            });

            // Vérifier les limites
            const limitsCheck = await UsageTrackingService.checkLimits(etablissementId);

            res.json({
                usage: metrics ? metrics.getTotalUsage() : null,
                limits: limitsCheck,
                periode: {
                    debut: periodeDebut,
                    fin: periodeFin
                },
                code: 'USAGE_STATS_RETRIEVED'
            });
        } catch (error) {
            console.error('Erreur récupération statistiques:', error);
            res.status(500).json({
                error: 'Erreur lors de la récupération des statistiques',
                code: 'USAGE_STATS_ERROR'
            });
        }
    }
};

module.exports = subscriptionController;
