const { Subscription, Etablissement } = require('../database/models');
const { StatutSubscription } = require('../utils/enums');

/**
 * Middleware pour vérifier que l'abonnement de l'établissement est actif
 */
const checkSubscriptionStatus = async (req, res, next) => {
    try {
        const etablissementId = req.utilisateur.etablissement_id;

        if (!etablissementId) {
            return res.status(403).json({
                error: 'Aucun établissement associé',
                code: 'NO_ESTABLISHMENT'
            });
        }

        const etablissement = await Etablissement.findByPk(etablissementId, {
            include: [{
                association: 'subscriptions',
                where: { statut: StatutSubscription.ACTIVE },
                required: false
            }]
        });

        if (!etablissement) {
            return res.status(404).json({
                error: 'Établissement non trouvé',
                code: 'ESTABLISHMENT_NOT_FOUND'
            });
        }

        // Vérifier si l'établissement est suspendu
        if (etablissement.statut === 'suspendu') {
            return res.status(403).json({
                error: 'Votre établissement est suspendu. Veuillez contacter le support.',
                code: 'ESTABLISHMENT_SUSPENDED',
                date_suspension: etablissement.date_suspension
            });
        }

        // Vérifier si l'abonnement existe et est actif
        const activeSubscription = etablissement.subscriptions && etablissement.subscriptions[0];

        if (!activeSubscription) {
            return res.status(403).json({
                error: 'Aucun abonnement actif. Veuillez souscrire à un plan.',
                code: 'NO_ACTIVE_SUBSCRIPTION'
            });
        }

        // Vérifier si l'abonnement est expiré
        if (activeSubscription.isExpired()) {
            return res.status(403).json({
                error: 'Votre abonnement a expiré. Veuillez le renouveler.',
                code: 'SUBSCRIPTION_EXPIRED',
                date_fin: activeSubscription.date_fin
            });
        }

        // Attacher l'abonnement à la requête pour utilisation ultérieure
        req.subscription = activeSubscription;
        next();
    } catch (error) {
        console.error('[SubscriptionMiddleware] Erreur:', error);
        res.status(500).json({
            error: 'Erreur lors de la vérification de l\'abonnement',
            code: 'SUBSCRIPTION_CHECK_ERROR'
        });
    }
};

/**
 * Middleware pour vérifier les limites d'utilisation
 */
const checkUsageLimits = (resourceType) => {
    return async (req, res, next) => {
        try {
            const etablissementId = req.utilisateur.etablissement_id;

            const etablissement = await Etablissement.findByPk(etablissementId);
            if (!etablissement) {
                return res.status(404).json({
                    error: 'Établissement non trouvé',
                    code: 'ESTABLISHMENT_NOT_FOUND'
                });
            }

            // Vérifier selon le type de ressource
            switch (resourceType) {
                case 'user':
                    if (etablissement.limite_utilisateurs) {
                        const { Utilisateur } = require('../database/models');
                        const currentCount = await Utilisateur.count({
                            where: { etablissement_id: etablissementId, actif: true }
                        });

                        if (currentCount >= etablissement.limite_utilisateurs) {
                            return res.status(403).json({
                                error: `Limite d'utilisateurs atteinte (${etablissement.limite_utilisateurs})`,
                                code: 'USER_LIMIT_REACHED',
                                current: currentCount,
                                limit: etablissement.limite_utilisateurs
                            });
                        }
                    }
                    break;

                case 'class':
                    if (etablissement.limite_classes) {
                        const { Classe } = require('../database/models');
                        const currentCount = await Classe.count({
                            where: { etablissement_id: etablissementId }
                        });

                        if (currentCount >= etablissement.limite_classes) {
                            return res.status(403).json({
                                error: `Limite de classes atteinte (${etablissement.limite_classes})`,
                                code: 'CLASS_LIMIT_REACHED',
                                current: currentCount,
                                limit: etablissement.limite_classes
                            });
                        }
                    }
                    break;

                case 'storage':
                    if (etablissement.limite_stockage_mb) {
                        // TODO: Implémenter la vérification du stockage réel
                        // Pour l'instant, on laisse passer
                    }
                    break;
            }

            next();
        } catch (error) {
            console.error('[UsageLimitsMiddleware] Erreur:', error);
            res.status(500).json({
                error: 'Erreur lors de la vérification des limites',
                code: 'USAGE_LIMITS_CHECK_ERROR'
            });
        }
    };
};

module.exports = {
    checkSubscriptionStatus,
    checkUsageLimits
};
