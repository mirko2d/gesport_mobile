const express = require('express');
const { authRequired } = require('../middleware/auth');
const Enrollment = require('../models/Enrollment');

const router = express.Router();

// Crear inscripción
router.post('/', authRequired, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { evento_id } = req.body || {};
    if (!evento_id) return res.status(400).json({ error: 'evento_id requerido' });
    const enr = await Enrollment.create({ user: userId, event: evento_id });
    res.status(201).json(enr);
  } catch (e) {
    // Manejar duplicado única (user+event)
    if (e.code === 11000) return res.status(409).json({ error: 'Ya estás inscripto en este evento' });
    next(e);
  }
});

// Eliminar inscripción
router.delete('/', authRequired, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { evento_id } = req.body || {};
    if (!evento_id) return res.status(400).json({ error: 'evento_id requerido' });
    await Enrollment.findOneAndDelete({ user: userId, event: evento_id });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Mis inscripciones
router.get('/mine', authRequired, async (req, res, next) => {
  try {
    const list = await Enrollment.find({ user: req.user._id })
      .populate('event')
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
