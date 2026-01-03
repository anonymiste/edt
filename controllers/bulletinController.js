const { Bulletin, Note, Evaluation, Matiere, Eleve, Utilisateur, Classe, Periode } = require('../database/models');
const { Op } = require('sequelize');

const bulletinController = {
    // Générer un bulletin pour un élève sur une période
    generateBulletin: async (req, res) => {
        try {
            const { eleve_id, periode_id } = req.body;

            // 1. Récupérer toutes les notes de la période
            const notes = await Note.findAll({
                where: { eleve_id },
                include: [{
                    model: Evaluation,
                    as: 'evaluation',
                    where: { periode_id },
                    include: [{ model: Matiere, as: 'matiere' }]
                }]
            });

            if (notes.length === 0) {
                return res.status(400).json({ error: 'Aucune note trouvée pour cette période' });
            }

            // 2. Grouper par matière et calculer les moyennes
            const matieresStats = {};

            notes.forEach(note => {
                const matId = note.evaluation.matiere.id;
                const matNom = note.evaluation.matiere.nom_matiere;
                const coef = note.evaluation.coefficient;
                const val = note.valeur; // Note sur 20 ramenée
                const sur = note.evaluation.note_sur;

                // Normaliser sur 20
                const noteSur20 = (val / sur) * 20;

                if (!matieresStats[matId]) {
                    matieresStats[matId] = { nom: matNom, totalPoints: 0, totalCoef: 0, notes: [] };
                }
                matieresStats[matId].notes.push(noteSur20);
                matieresStats[matId].totalPoints += noteSur20 * coef;
                matieresStats[matId].totalCoef += coef;
            });

            const detailsMatieres = [];
            let someMoyenneGeneralePoints = 0;
            let someMoyenneGeneraleCoefs = 0;

            for (const [matId, stats] of Object.entries(matieresStats)) {
                const moyenneMatiere = stats.totalPoints / stats.totalCoef;
                detailsMatieres.push({
                    matiere_id: matId,
                    nom_matiere: stats.nom,
                    moyenne: parseFloat(moyenneMatiere.toFixed(2)),
                    coef_matiere: 1, // Le coef de la matière elle-même pour la moyenne générale (TODO: Ajouter coef dans le modèle Matiere ou ClasseMatiere)
                    appreciation: ''
                });

                // Supposons coef matière = 1 pour Simplifier ici (à améliorer)
                someMoyenneGeneralePoints += moyenneMatiere * 1;
                someMoyenneGeneraleCoefs += 1;
            }

            const moyenneGenerale = someMoyenneGeneralePoints / someMoyenneGeneraleCoefs;

            // 3. Sauvegarder/Mettre à jour le bulletin
            // Récupérer l'élève pour connaitre sa classe
            const eleve = await Eleve.findByPk(eleve_id);

            const [bulletin, created] = await Bulletin.findOrCreate({
                where: { eleve_id, periode_id },
                defaults: {
                    classe_id: eleve.classe_id,
                    moyenne_generale: parseFloat(moyenneGenerale.toFixed(2)),
                    details_matieres: detailsMatieres,
                    statut: 'BROUILLON'
                }
            });

            if (!created) {
                await bulletin.update({
                    moyenne_generale: parseFloat(moyenneGenerale.toFixed(2)),
                    details_matieres: detailsMatieres,
                    date_generation: new Date()
                });
            }

            res.json({ message: 'Bulletin généré', bulletin, code: 'BULLETIN_GENERATED' });

        } catch (error) {
            console.error('Erreur génération bulletin:', error);
            res.status(500).json({ error: 'Erreur génération', code: 'BULLETIN_GEN_ERROR' });
        }
    },

    getBulletin: async (req, res) => {
        try {
            const { eleve_id, periode_id } = req.query;
            const bulletin = await Bulletin.findOne({
                where: { eleve_id, periode_id },
                include: [
                    { model: Periode, as: 'periode' },
                    { model: Classe, as: 'classe' },
                    { model: Eleve, as: 'eleve', include: ['utilisateur'] }
                ]
            });

            if (!bulletin) return res.status(404).json({ error: 'Bulletin non trouvé' });

            res.json({ bulletin, code: 'BULLETIN_RETRIEVED' });
        } catch (error) {
            console.error('Erreur récupération bulletin:', error);
            res.status(500).json({ error: 'Erreur récupération', code: 'BULLETIN_ERROR' });
        }
    }
};

module.exports = bulletinController;
