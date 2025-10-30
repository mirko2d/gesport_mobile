const express = require('express');
const { authRequired, requireRole } = require('../middleware/auth');
const Event = require('../models/Event');

const router = express.Router();

// Listar eventos (público)
router.get('/', async (req, res, next) => {
  try {
    const events = await Event.find({ activo: true }).sort({ fecha: 1 }).lean();
    res.json(events);
  } catch (e) {
    next(e);
  }
});

// Crear evento (admin)
router.post('/', authRequired, requireRole(['admin', 'superadmin']), async (req, res, next) => {
  try {
    const event = await Event.create(req.body || {});
    res.status(201).json(event);
  } catch (e) {
    next(e);
  }
});

// Eliminar evento (admin)
router.delete('/delete/:id', authRequired, requireRole(['admin', 'superadmin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    await Event.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
