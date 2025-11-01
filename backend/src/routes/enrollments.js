const express = require('express');
const { authRequired, requireRole } = require('../middleware/auth');
const Event = require('../models/Event');
const Enrollment = require('../models/Enrollment');

const router = express.Router();

// Crear inscripción
router.post('/', authRequired, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { evento_id, form } = req.body || {};
    if (!evento_id) return res.status(400).json({ error: 'evento_id requerido' });
    // Verificar cupos
    const ev = await Event.findById(evento_id).lean();
    if (!ev) return res.status(404).json({ error: 'Evento no encontrado' });
    if (ev.activo === false) return res.status(400).json({ error: 'Evento no activo' });
    if (ev.fecha && new Date(ev.fecha).getTime() < Date.now()) {
      return res.status(409).json({ error: 'Evento finalizado' });
    }
    if (typeof ev.cupos === 'number' && ev.cupos > 0) {
      const current = await Enrollment.countDocuments({ event: evento_id });
      if (current >= ev.cupos) return res.status(409).json({ error: 'Cupo completo' });
    }
    // Validaciones ligeras de form (opcional)
    let formPayload = undefined;
    if (form && typeof form === 'object') {
      const f = form || {};
      // Si se envían consentimientos deben ser verdaderos
      if (f.aceptoTerminos === false || f.aceptoDescargo === false) {
        return res.status(400).json({ error: 'Debe aceptar términos y descargo' });
      }
      // Sanitizar campos esperados
      formPayload = {
        dni: typeof f.dni === 'string' ? f.dni.trim() : undefined,
        fechaNacimiento: f.fechaNacimiento ? new Date(f.fechaNacimiento) : undefined,
        genero: ['F', 'M', 'X', 'Otro'].includes(f.genero) ? f.genero : undefined,
        tallaRemera: ['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(f.tallaRemera) ? f.tallaRemera : undefined,
        emergencia: {
          nombre: f?.emergencia?.nombre ? String(f.emergencia.nombre).trim() : undefined,
          telefono: f?.emergencia?.telefono ? String(f.emergencia.telefono).trim() : undefined,
          relacion: f?.emergencia?.relacion ? String(f.emergencia.relacion).trim() : undefined,
        },
        salud: {
          alergias: f?.salud?.alergias ? String(f.salud.alergias).trim() : undefined,
          condiciones: f?.salud?.condiciones ? String(f.salud.condiciones).trim() : undefined,
          medicamentos: f?.salud?.medicamentos ? String(f.salud.medicamentos).trim() : undefined,
        },
        club: typeof f.club === 'string' ? f.club.trim() : undefined,
        ciudad: typeof f.ciudad === 'string' ? f.ciudad.trim() : undefined,
        pais: typeof f.pais === 'string' ? f.pais.trim() : undefined,
        aceptoTerminos: f.aceptoTerminos === true ? true : undefined,
        aceptoDescargo: f.aceptoDescargo === true ? true : undefined,
      };
    }

    const enr = await Enrollment.create({ user: userId, event: evento_id, form: formPayload });
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
// Listar inscriptos por evento (solo admin/superadmin)
router.get('/event/:id', authRequired, requireRole(['admin', 'superadmin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const list = await Enrollment.find({ event: id })
      .populate('user', 'nombre apellido email avatarUrl')
      .sort({ createdAt: -1 })
      .lean();
    const participants = list.map((enr) => ({
      _id: enr.user?._id,
      nombre: enr.user?.nombre,
      apellido: enr.user?.apellido,
      email: enr.user?.email,
      avatarUrl: enr.user?.avatarUrl,
    }));
    res.json({ count: participants.length, participants });
  } catch (e) {
    next(e);
  }
});
