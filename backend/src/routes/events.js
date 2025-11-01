const express = require('express');
const { authRequired, requireRole } = require('../middleware/auth');
const Event = require('../models/Event');
const Enrollment = require('../models/Enrollment');
const { listEvents } = require('../controllers/eventsController');

const router = express.Router();

// Listar eventos (público)
router.get('/', listEvents);

// Crear evento (solo superadmin)
router.post('/', authRequired, requireRole(['superadmin']), async (req, res, next) => {
  try {
    const payload = { ...(req.body || {}), createdBy: req.user._id };
    // No permitir crear eventos en fecha pasada
    if (payload.fecha) {
      const when = new Date(payload.fecha);
      if (!isNaN(when.getTime()) && when.getTime() < Date.now()) {
        return res.status(400).json({ error: 'La fecha del evento ya pasó. Elija una fecha futura.' });
      }
    }
    const event = await Event.create(payload);
    res.status(201).json(event);
  } catch (e) {
    next(e);
  }
});

// Eliminar evento (admin)
// Eliminar evento: solo superadmin
router.delete('/delete/:id', authRequired, requireRole(['superadmin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    await Event.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
// Obtener un evento por ID (público)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const ev = await Event.findById(id).lean();
    if (!ev || ev.activo === false) return res.status(404).json({ error: 'Evento no encontrado' });
    const count = await Enrollment.countDocuments({ event: ev._id });
    return res.json({
      ...ev,
      participantes: count,
      maxParticipantes: typeof ev.cupos === 'number' ? ev.cupos : null,
    });
  } catch (e) {
    next(e);
  }
});
// Actualizar evento (solo superadmin)
router.patch('/:id', authRequired, requireRole(['superadmin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const update = req.body || {};
    if (update.fecha) {
      const when = new Date(update.fecha);
      if (!isNaN(when.getTime()) && when.getTime() < Date.now()) {
        return res.status(400).json({ error: 'No se puede establecer una fecha pasada.' });
      }
    }
    const ev = await Event.findByIdAndUpdate(id, update, { new: true });
    if (!ev) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(ev);
  } catch (e) {
    next(e);
  }
});

// List my own events (superadmin)
router.get('/mine', authRequired, requireRole(['superadmin']), async (req, res, next) => {
  try {
    const events = await Event.find({ createdBy: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json(events);
  } catch (e) {
    next(e);
  }
});
