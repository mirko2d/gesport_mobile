const express = require('express');
const { authRequired, requireRole } = require('../middleware/auth');
const Result = require('../models/Result');
const Event = require('../models/Event');

const router = express.Router();

// Mis resultados
router.get('/mine', authRequired, async (req, res, next) => {
  try {
    const list = await Result.find({ user: req.user._id })
      .populate('event', 'nombre titulo fecha')
      .sort({ position: 1, finishedAt: 1 })
      .lean();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

// Resultados por evento (lista completa)
router.get('/events/:eventId', async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const list = await Result.find({ event: eventId })
      .populate('user', 'nombre apellido')
      .sort({ position: 1, finishedAt: 1 })
      .lean();
    const mapped = list.map((r) => ({
      position: r.position || 0,
      userId: r.user?._id,
      nombre: r.user?.nombre,
      apellido: r.user?.apellido,
      dorsal: r.dorsal,
      timeMs: r.timeMs,
      finishedAt: r.finishedAt,
    }));
    res.json(mapped);
  } catch (e) {
    next(e);
  }
});

// Registrar paso por meta (contador) - solo superadmin
router.post('/events/:eventId/finish', authRequired, requireRole(['superadmin']), async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { dorsal, note, userId, timeMs } = req.body || {};

    // Validar evento existe (no obligatorio, pero útil)
    const ev = await Event.findById(eventId).lean();
    if (!ev) return res.status(404).json({ error: 'Evento no encontrado' });

    // Evitar duplicado por dorsal si se envía
    if (dorsal != null && dorsal !== '') {
      const exists = await Result.findOne({ event: eventId, dorsal: String(dorsal) }).lean();
      if (exists) {
        const count = await Result.countDocuments({ event: eventId });
        return res.json({ ok: true, count, lastFinish: { position: exists.position, finishedAt: exists.finishedAt, dorsal: exists.dorsal }, duplicated: true });
      }
    }

    // Asignar posición secuencial simple
    const countBefore = await Result.countDocuments({ event: eventId });
    const position = countBefore + 1;
    const doc = await Result.create({
      event: eventId,
      user: userId || undefined,
      dorsal: dorsal != null && dorsal !== '' ? String(dorsal) : undefined,
      note: note || undefined,
      timeMs: typeof timeMs === 'number' ? timeMs : undefined,
      position,
      finishedAt: new Date(),
    });

    res.json({ ok: true, count: position, lastFinish: { position: doc.position, finishedAt: doc.finishedAt, dorsal: doc.dorsal } });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
