const express = require('express');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

const router = express.Router();

// Utilidad: normalizar correos Gmail (enlazar al "original")
// - Convierte googlemail.com -> gmail.com
// - Elimina puntos en la parte local
// - Elimina etiquetas "+..." en la parte local
function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const raw = email.trim().toLowerCase();
  const [local, domainRaw] = raw.split('@');
  if (!local || !domainRaw) return raw;
  let domain = domainRaw;
  if (domain === 'googlemail.com') domain = 'gmail.com';
  if (domain === 'gmail.com') {
    const plusIdx = local.indexOf('+');
    const base = plusIdx >= 0 ? local.slice(0, plusIdx) : local;
    const noDots = base.replace(/\./g, '');
    return `${noDots}@${domain}`;
  }
  return `${local}@${domain}`;
}

// Password segura: 8+ chars, mayúscula, minúscula, dígito, símbolo
function isStrongPassword(pw) {
  if (typeof pw !== 'string') return false;
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pw);
}

// Registro
router.post('/signup', async (req, res, next) => {
  try {
    const { nombre, apellido, email, contrasenia, avatarUrl } = req.body || {};
    if (!nombre || !apellido || !email || !contrasenia) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    const emailNorm = normalizeEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      return res.status(400).json({ error: 'Correo inválido' });
    }
    if (!isStrongPassword(contrasenia)) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula, número y símbolo.' });
    }
    const exists = await User.findOne({ email: emailNorm });
    if (exists) return res.status(409).json({ error: 'El email ya está registrado' });
    const user = await User.create({ nombre, apellido, email: emailNorm, contrasenia, avatarUrl });
    return res.json('El usuario ha sido creado con exito.');
  } catch (e) {
    next(e);
  }
});

// Login
router.post('/signin', async (req, res, next) => {
  try {
    const { email, contrasenia } = req.body || {};
    if (!email || !contrasenia) return res.status(400).json({ error: 'Email y contrasenia requeridos' });
    const rawLower = String(email).trim().toLowerCase();
    const emailNorm = normalizeEmail(rawLower);
    let user = await User.findOne({ email: emailNorm });
    if (!user) {
      // fallback por si hay cuentas antiguas guardadas sin normalizar
      user = await User.findOne({ email: rawLower });
    }
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    const ok = await user.comparePassword(contrasenia);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    // Enforce special roles based on env emails (useful if la cuenta fue creada por signup como role 'user')
    const SA_EMAIL = process.env.SUPERADMIN_EMAIL;
    const AD_EMAIL = process.env.ADMIN_EMAIL;
    let roleChanged = false;
    if (SA_EMAIL && emailNorm === SA_EMAIL.toLowerCase() && user.role !== 'superadmin') {
      user.role = 'superadmin';
      roleChanged = true;
    } else if (AD_EMAIL && emailNorm === AD_EMAIL.toLowerCase() && user.role !== 'admin' && user.role !== 'superadmin') {
      user.role = 'admin';
      roleChanged = true;
    }
    if (roleChanged) await user.save();

    const token = signToken(user);
    const userSafe = {
      _id: user._id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
    };
    res.json({ token, user: userSafe });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
