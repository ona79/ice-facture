const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1]; // Supporte "Bearer TOKEN"
  if (!token) return res.status(401).json({ msg: 'Pas de token, accès refusé' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token non valide' });
  }
};
//backend/middleware/auth.js