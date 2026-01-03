const { SessionExamen, Matiere, Classe, RepartitionSalle, Salle } = require('../database/models');
const { Op } = require('sequelize');

const sessionExamenController = {
    // Liste des sessions d'une classe
    getSessionsByClasse: async (req, res) => {
        try {
            const { classeId } = req.params;
            const sessions = await SessionExamen.findAll({
                where: { classe_id: classeId },
                include: [
                    { model: Matiere, as: 'matiere' },
                    { model: Classe, as: 'classe' },
                    { model: RepartitionSalle, as: 'repartitions', include: [{ model: Salle, as: 'salle' }] }
                ],
                order: [['date_examen', 'ASC'], ['heure_debut', 'ASC']]
            });
            res.json({ sessions, code: 'SESSIONS_RETRIEVED' });
        } catch (error) {
            console.error('Erreur récupération sessions:', error);
            res.status(500).json({ error: 'Erreur serveur', code: 'SESSIONS_ERROR' });
        }
    },

    // Calendrier global des examens
    getCalendrier: async (req, res) => {
        try {
            const { date_debut, date_fin, etablissement_id } = req.query;

            const where = {};
            if (date_debut && date_fin) {
                where.date_examen = { [Op.between]: [date_debut, date_fin] };
            }

            const sessions = await SessionExamen.findAll({
                where,
                include: [
                    { model: Matiere, as: 'matiere' },
                    {
                        model: Classe,
                        as: 'classe',
                        where: etablissement_id ? { etablissement_id } : undefined
                    }
                ],
                order: [['date_examen', 'ASC'], ['heure_debut', 'ASC']]
            });

            res.json({ sessions, code: 'CALENDRIER_RETRIEVED' });
        } catch (error) {
            console.error('Erreur récupération calendrier:', error);
            res.status(500).json({ error: 'Erreur serveur', code: 'CALENDRIER_ERROR' });
        }
    },

    // Créer une session d'examen
    createSession: async (req, res) => {
        try {
            const { titre, matiere_id, classe_id, date_examen, heure_debut, heure_fin, duree_minutes, type, coefficient, instructions } = req.body;

            // Vérifier les conflits de salle (optionnel à ce stade)
            // La vérification sera faite lors de la répartition

            const session = await SessionExamen.create({
                titre, matiere_id, classe_id, date_examen, heure_debut, heure_fin,
                duree_minutes, type, coefficient, instructions, statut: 'PLANIFIE'
            });

            res.status(201).json({ message: 'Session créée', session, code: 'SESSION_CREATED' });
        } catch (error) {
            console.error('Erreur création session:', error);
            res.status(500).json({ error: 'Erreur création', code: 'SESSION_CREATE_ERROR' });
        }
    },

    // Modifier une session
    updateSession: async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            const session = await SessionExamen.findByPk(id);
            if (!session) return res.status(404).json({ error: 'Session non trouvée' });

            await session.update(updates);
            res.json({ message: 'Session mise à jour', session, code: 'SESSION_UPDATED' });
        } catch (error) {
            console.error('Erreur mise à jour session:', error);
            res.status(500).json({ error: 'Erreur mise à jour', code: 'SESSION_UPDATE_ERROR' });
        }
    },

    // Annuler une session
    deleteSession: async (req, res) => {
        try {
            const { id } = req.params;
            const session = await SessionExamen.findByPk(id);

            if (!session) return res.status(404).json({ error: 'Session non trouvée' });

            await session.update({ statut: 'ANNULE' });
            res.json({ message: 'Session annulée', code: 'SESSION_CANCELLED' });
        } catch (error) {
            console.error('Erreur annulation session:', error);
            res.status(500).json({ error: 'Erreur annulation', code: 'SESSION_CANCEL_ERROR' });
        }
    },

    // Obtenir les élèves éligibles pour un rattrapage
    getEligibleStudents: async (req, res) => {
        try {
            const { id } = req.params;
            const session = await SessionExamen.findByPk(id, {
                include: [{ model: Classe, as: 'classe' }]
            });

            if (!session) return res.status(404).json({ error: 'Session non trouvée' });

            // Récupérer tous les élèves de la classe
            const { Eleve, Note, Evaluation } = require('../database/models');
            const eleves = await Eleve.findAll({
                where: { classe_id: session.classe_id },
                include: ['utilisateur']
            });

            // Identifier les élèves absents ou ayant échoué
            const eligibles = [];
            for (const eleve of eleves) {
                // Vérifier s'il a une note pour cet examen (via Evaluation liée)
                // Pour simplifier, on considère tous les élèves éligibles
                // Dans une vraie implémentation, vérifier les notes et absences
                eligibles.push({
                    eleve_id: eleve.id,
                    nom: eleve.utilisateur.nom,
                    prenom: eleve.utilisateur.prenom,
                    motif: 'ABSENCE' // À déterminer selon la logique métier
                });
            }

            res.json({ eligibles, total: eligibles.length, code: 'ELIGIBLES_RETRIEVED' });
        } catch (error) {
            console.error('Erreur récupération élèves éligibles:', error);
            res.status(500).json({ error: 'Erreur serveur', code: 'ELIGIBLES_ERROR' });
        }
    },

    // Créer une session de rattrapage
    createRetake: async (req, res) => {
        try {
            const { id } = req.params;
            const { date_examen, heure_debut, heure_fin, eleves_eligibles } = req.body;

            const sessionOriginale = await SessionExamen.findByPk(id);
            if (!sessionOriginale) return res.status(404).json({ error: 'Session originale non trouvée' });

            // Créer la session de rattrapage
            const sessionRattrapage = await SessionExamen.create({
                titre: `Rattrapage - ${sessionOriginale.titre}`,
                matiere_id: sessionOriginale.matiere_id,
                classe_id: sessionOriginale.classe_id,
                date_examen,
                heure_debut,
                heure_fin,
                duree_minutes: sessionOriginale.duree_minutes,
                type: 'RATTRAPAGE',
                coefficient: sessionOriginale.coefficient,
                statut: 'PLANIFIE',
                session_examen_originale_id: id
            });

            // Créer les entrées Rattrapage pour chaque élève
            const { Rattrapage, Cours } = require('../database/models');

            // Trouver le cours correspondant à cette matière et classe
            const cours = await Cours.findOne({
                where: {
                    matiere_id: sessionOriginale.matiere_id,
                    classe_id: sessionOriginale.classe_id
                }
            });

            const rattrapages = [];
            for (const eleve of eleves_eligibles) {
                const rattrapage = await Rattrapage.create({
                    cours_id: cours?.id || sessionOriginale.matiere_id, // Fallback si pas de cours trouvé (attention aux FK)
                    type_rattrapage: 'examen',
                    duree: sessionOriginale.duree_minutes,
                    eleves_concernes: [eleve.eleve_id],
                    statut: 'PLANIFIE',
                    session_examen_id: sessionRattrapage.id,
                    motif_rattrapage: eleve.motif || 'AUTRE',
                    motif: `Rattrapage examen: ${sessionOriginale.titre}`
                });
                rattrapages.push(rattrapage);
            }

            res.status(201).json({
                message: 'Session de rattrapage créée',
                session: sessionRattrapage,
                rattrapages_count: rattrapages.length,
                code: 'RETAKE_CREATED'
            });
        } catch (error) {
            console.error('Erreur création rattrapage:', error);
            res.status(500).json({ error: 'Erreur création rattrapage', code: 'RETAKE_CREATE_ERROR' });
        }
    }
};

module.exports = sessionExamenController;
