// controllers/teacherAbsenceController.js
const { Absence, Enseignant, Cours, Utilisateur, LogModification } = require('../database/models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { StatutAbsence, TypeOperation } = require('../utils/enums');
const { resolveEnseignantId } = require('../middleware/auth');

/**
 * Helper to get the Enseignant ID for the logged‑in user.
 */
const getEnseignantId = async (utilisateur) => {
    return await resolveEnseignantId(utilisateur);
};

const teacherAbsenceController = {
    /**
     * Retrieve absences belonging to the authenticated teacher.
     */
    getMyAbsences: async (req, res) => {
        try {
            const utilisateur = req.utilisateur;
            const enseignantId = await getEnseignantId(utilisateur);
            if (!enseignantId) {
                return res.status(403).json({ error: 'Enseignant non trouvé ou accès refusé', code: 'TEACHER_NOT_FOUND' });
            }

            const absences = await Absence.findAll({
                where: { enseignant_id: enseignantId },
                include: [
                    { association: 'enseignant', include: [{ association: 'utilisateur', attributes: ['id', 'prenom', 'nom'] }] },
                    { association: 'cours', attributes: ['id', 'nom'] },
                ],
                order: [['date_debut', 'DESC']]
            });

            res.json({ absences, code: 'TEACHER_ABSENCES_RETRIEVED' });
        } catch (error) {
            console.error('Erreur récupération absences enseignant:', error);
            res.status(500).json({ error: 'Erreur serveur', code: 'TEACHER_ABSENCES_ERROR' });
        }
    },

    /**
     * Declare a new absence for the authenticated teacher.
     */
    declarerMyAbsence: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array(), code: 'VALIDATION_ERROR' });
            }

            const utilisateur = req.utilisateur;
            const enseignantId = await getEnseignantId(utilisateur);
            if (!enseignantId) {
                return res.status(403).json({ error: 'Enseignant non trouvé ou accès refusé', code: 'TEACHER_NOT_FOUND' });
            }

            const { cours_id, date_debut, date_fin, motif, code } = req.body;

            // Basic validation – ensure required fields are present
            if (!cours_id || !date_debut || !date_fin) {
                return res.status(400).json({ error: 'Paramètres manquants', code: 'MISSING_PARAMS' });
            }

            const absence = await Absence.create({
                enseignant_id: enseignantId,
                cours_id,
                date_debut,
                date_fin,
                motif,
                code,
                statut: StatutAbsence.DECLAREE,
                type_operation: TypeOperation.CREATION,
            });

            // Log the creation
            await LogModification.create({
                utilisateur_id: utilisateur.id,
                operation: TypeOperation.CREATION,
                cible: 'Absence',
                cible_id: absence.id,
                details: JSON.stringify({ cours_id, date_debut, date_fin, motif })
            });

            res.status(201).json({ absence, code: 'ABSENCE_DECLARED' });
        } catch (error) {
            console.error('Erreur déclaration absence enseignant:', error);
            res.status(500).json({ error: 'Erreur serveur', code: 'DECLARE_ABSENCE_ERROR' });
        }
    }
};

module.exports = teacherAbsenceController;
