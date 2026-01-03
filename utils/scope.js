const { RoleUtilisateur } = require('./enums');

const isAdminSystem = (utilisateur = {}) => utilisateur?.role === RoleUtilisateur.ADMIN;

const resolveScopedEtablissementId = (req) => {
  const fromQuery = req.query?.etablissement_id;
  const fromBody = req.body?.etablissement_id;
  const ut = req.utilisateur;

  // Récupérer l'ID direct de l'utilisateur ou via ses profils spécialisés
  const userEtabId = ut?.etablissement_id ||
    ut?.directeur?.etablissement_id ||
    ut?.enseignant?.etablissement_id ||
    ut?.eleve?.etablissement_id ||
    ut?.responsablePedagogique?.etablissement_id ||
    null;

  if (isAdminSystem(ut)) {
    return fromQuery || fromBody || userEtabId;
  }

  return userEtabId;
};

const applyEtablissementScope = (req, baseWhere = {}) => {
  const scopedId = resolveScopedEtablissementId(req);

  if (!isAdminSystem(req.utilisateur)) {
    return { ...baseWhere, etablissement_id: scopedId };
  }

  if (scopedId) {
    return { ...baseWhere, etablissement_id: scopedId };
  }

  return baseWhere;
};

module.exports = {
  isAdminSystem,
  resolveScopedEtablissementId,
  applyEtablissementScope
};

