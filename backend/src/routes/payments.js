const express = require('express');
// Carga dinámica del SDK ESM de Mercado Pago para evitar errores con require()
let _mpClient = null;
let _Preference = null;
let _Payment = null;
async function getMP() {
  if (_mpClient && _Preference && _Payment) {
    return { mpClient: _mpClient, Preference: _Preference, Payment: _Payment };
  }
  const mp = await import('mercadopago');
  const { MercadoPagoConfig, Preference, Payment } = mp;
  _mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });
  _Preference = Preference;
  _Payment = Payment;
  return { mpClient: _mpClient, Preference: _Preference, Payment: _Payment };
}
const { authRequired } = require('../middleware/auth');
const Enrollment = require('../models/Enrollment');
const Event = require('../models/Event');

const router = express.Router();

// Configurar Mercado Pago con token del servidor
if (!process.env.MP_ACCESS_TOKEN) {
  console.warn('[payments] MP_ACCESS_TOKEN no está configurado. Las rutas de pago fallarán hasta que lo configures en .env');
}

const CURRENCY = process.env.MP_CURRENCY || 'ARS';
const NOTIF_URL = process.env.MP_WEBHOOK_URL || undefined; // Debe ser https público para que funcione en producción

// Crear preferencia para pagar una inscripción
router.post('/enrollments/:id/preference', authRequired, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const enr = await Enrollment.findById(id).populate('event');
    if (!enr) return res.status(404).json({ error: 'Inscripción no encontrada' });
    if (enr.user.toString() !== userId) {
      return res.status(403).json({ error: 'No puedes pagar una inscripción de otro usuario' });
    }
    const ev = enr.event && enr.event._id ? enr.event : await Event.findById(enr.event);
    if (!ev) return res.status(404).json({ error: 'Evento no encontrado' });
    const amount = typeof ev.precio === 'number' ? ev.precio : 0;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Este evento no requiere pago' });
    }

    const title = `Inscripción ${ev.titulo || ev.nombre || 'Evento'}`;

    const pref = {
      items: [
        {
          title,
          unit_price: Number(amount),
          quantity: 1,
          currency_id: CURRENCY,
        },
      ],
      payer: {
        email: req.user.email,
        name: [req.user.nombre, req.user.apellido].filter(Boolean).join(' ').trim() || undefined,
      },
      external_reference: enr._id.toString(),
      metadata: {
        enrollmentId: enr._id.toString(),
        userId,
        eventId: ev._id.toString(),
      },
      auto_return: 'approved',
    };
    if (NOTIF_URL) {
      pref.notification_url = NOTIF_URL;
    }

  const { mpClient, Preference } = await getMP();
  const preference = new Preference(mpClient);
  const result = await preference.create({ body: pref });
  const body = result || {};

    // Guardar datos de pago en la inscripción
    enr.pago = {
      ...(enr.pago || {}),
      estado: 'PENDIENTE',
      monto: amount,
      moneda: CURRENCY,
      proveedor: 'mercadopago',
      preferenciaId: body.id,
      initPoint: body.init_point || body.sandbox_init_point,
    };
    await enr.save();

    return res.json({
      preference_id: body.id,
      init_point: body.init_point || body.sandbox_init_point,
      enrollmentId: enr._id,
      amount,
      currency: CURRENCY,
    });
  } catch (e) {
    next(e);
  }
});

// Webhook para recibir notificaciones de pago de Mercado Pago
router.post('/webhook', async (req, res, next) => {
  try {
    // Soportar notificación estilo query (topic/id) y estilo body (action/data.id)
  const topic = req.query.topic || req.query.type || req.body?.type || req.body?.action;
    let paymentId = req.query.id || req.query['data.id'] || req.body?.data?.id || req.body?.id;

    if ((topic === 'payment' || String(topic).includes('payment')) && paymentId) {
      // Obtener detalle del pago desde MP
  const { mpClient, Payment } = await getMP();
  const payment = new Payment(mpClient);
  const p = await payment.get({ id: paymentId });
      const status = p.status; // approved, rejected, pending, in_process
      const externalRef = p.external_reference;

      if (!externalRef) {
        // No podemos asociar a una inscripción
        console.warn('[payments] payment sin external_reference', paymentId);
        return res.status(200).json({ ok: true });
      }

      const enr = await Enrollment.findById(externalRef);
      if (!enr) {
        console.warn('[payments] inscripción no encontrada para external_reference', externalRef);
        return res.status(200).json({ ok: true });
      }

      let nuevoEstado = 'PENDIENTE';
      if (status === 'approved') nuevoEstado = 'APROBADO';
      else if (status === 'rejected' || status === 'cancelled') nuevoEstado = 'RECHAZADO';
      else nuevoEstado = 'PENDIENTE';

      enr.pago = {
        ...(enr.pago || {}),
        estado: nuevoEstado,
        referencia: String(p.id),
        pagadoEn: p.date_approved ? new Date(p.date_approved) : enr.pago?.pagadoEn,
        reciboUrl: p.transaction_details?.external_resource_url || enr.pago?.reciboUrl,
      };
      if (nuevoEstado === 'APROBADO') {
        enr.estado = 'CONFIRMADA';
      }
      await enr.save();

      return res.status(200).json({ ok: true });
    }

    // Otros tipos no usados
    return res.status(200).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Consultar estado de pago para una inscripción (polling desde el cliente)
router.get('/enrollments/:id/status', authRequired, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();
    const enr = await Enrollment.findById(id).lean();
    if (!enr) return res.status(404).json({ error: 'Inscripción no encontrada' });
    if (enr.user.toString() !== userId) return res.status(403).json({ error: 'No autorizado' });
    return res.json({ estado: enr.estado, pago: enr.pago });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
