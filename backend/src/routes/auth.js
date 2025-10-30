const express = require('express');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

const router = express.Router();

// Registro
router.post('/signup', async (req, res, next) => {
  try {
    const { nombre, apellido, email, contrasenia, avatarUrl } = req.body || {};
    if (!nombre || !apellido || !email || !contrasenia) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'El email ya está registrado' });
    const user = await User.create({ nombre, apellido, email, contrasenia, avatarUrl });
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
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    const ok = await user.comparePassword(contrasenia);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });
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
