const express = require('express');
const { authRequired, requireRole } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Cambiar rol (solo superadmin)
router.post('/set', authRequired, requireRole(['superadmin']), async (req, res, next) => {
  try {
    const { user_id, role } = req.body || {};
    if (!user_id || !['user', 'admin', 'superadmin'].includes(role)) return res.status(400).json({ error: 'Datos inválidos' });
    const user = await User.findByIdAndUpdate(user_id, { role }, { new: true }).select('-contrasenia');
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
