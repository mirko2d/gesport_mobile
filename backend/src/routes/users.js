const express = require('express');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/me', authRequired, async (req, res) => {
  const u = req.user;
  res.json({ _id: u._id, nombre: u.nombre, apellido: u.apellido, email: u.email, avatarUrl: u.avatarUrl, role: u.role, pesoKg: u.pesoKg, alturaCm: u.alturaCm });
});

// Admin: listar usuarios
router.get('/', authRequired, async (req, res) => {
  // Admin y superadmin ven lista completa; usuarios ven solo su propio usuario
  const u = req.user;
  if (u.role === 'admin' || u.role === 'superadmin') {
    const users = await require('../models/User').find().select('-contrasenia').lean();
    return res.json(users);
  }
  return res.json([{ _id: u._id, nombre: u.nombre, apellido: u.apellido, email: u.email, avatarUrl: u.avatarUrl, role: u.role }]);
});

module.exports = router;
// Actualizar perfil propio (peso/altura y otros campos permitidos)
router.patch('/me', authRequired, async (req, res) => {
  try {
    const u = req.user;
    const { pesoKg, alturaCm, nombre, apellido, avatarUrl } = req.body || {};
    if (pesoKg !== undefined) u.pesoKg = pesoKg;
    if (alturaCm !== undefined) u.alturaCm = alturaCm;
    if (nombre !== undefined) u.nombre = nombre;
    if (apellido !== undefined) u.apellido = apellido;
    if (avatarUrl !== undefined) u.avatarUrl = avatarUrl;
    await u.save();
    return res.json({ _id: u._id, nombre: u.nombre, apellido: u.apellido, email: u.email, avatarUrl: u.avatarUrl, role: u.role, pesoKg: u.pesoKg, alturaCm: u.alturaCm });
  } catch (e) {
    return res.status(400).json({ error: e?.message || 'No se pudo actualizar el perfil' });
  }
});
