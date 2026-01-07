const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Supporte le format "Bearer TOKEN" (utilisé par Axios) ou le header direct
  const authHeader = req.header('Authorization');
  const token = authHeader ? authHeader.split(' ')[1] : req.header('x-auth-token');

  // Si aucun token n'est présent dans la requête
  if (!token) {
    return res.status(401).json({ msg: 'Pas de token, accès refusé' });
  }

  try {
    // Vérification du token avec la clé secrète configurée sur Render
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // CORRECTION CRUCIALE POUR L'INVENTAIRE :
    req.user = decoded.user;

    // On définit l'ID du propriétaire (admin) pour filtrer les données
    // Si c'est un employé, ownerId est le parentId. Si c'est un admin, c'est son propre ID.
    req.user.ownerId = req.user.role === 'employee' ? req.user.parentId : req.user.id;
    next();
  } catch (err) {
    console.error("Erreur Auth Middleware:", err.message);
    res.status(401).json({ msg: 'Token non valide ou expiré' });
  }
};