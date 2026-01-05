const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Supporte le format "Bearer TOKEN" (standard Axios) ou le token direct
  const authHeader = req.header('Authorization');
  const token = authHeader ? authHeader.split(' ')[1] : req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ msg: 'Pas de token, accès refusé' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // CORRECTION CRUCIALE : 
    // Ton Login crée un token avec { user: { id: ... } }
    // On doit donc extraire decoded.user pour que req.user.id soit disponible
    req.user = decoded.user; 
    
    next();
  } catch (err) {
    console.error("Erreur Auth Middleware:", err.message);
    res.status(401).json({ msg: 'Token non valide' });
  }
};