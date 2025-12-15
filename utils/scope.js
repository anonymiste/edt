const { RoleUtilisateur } = require('./enums');

const isAdminSystem = (utilisateur = {}) => utilisateur?.role === RoleUtilisateur.ADMIN;

const resolveScopedEtablissementId = (req) => {
  const fromQuery = req.query?.etablissement_id;
  const fromBody = req.body?.etablissement_id;

  if (isAdminSystem(req.utilisateur)) {
    return fromQuery || fromBody || req.utilisateur?.etablissement_id || null;
  }

  return req.utilisateur?.etablissement_id || null;
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

