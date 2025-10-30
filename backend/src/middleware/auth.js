const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

async function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Token inválido' });
  // Necesitamos un documento de Mongoose (no .lean()) para poder mutar y guardar en rutas como PATCH /users/me
  const user = await User.findById(payload.uid).select('-contrasenia');
  if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
  req.user = user;
  next();
}

function requireRole(roles = []) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    if (allowed.length && !allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permisos insuficientes' });
    }
    next();
  };
}

module.exports = { authRequired, requireRole };
