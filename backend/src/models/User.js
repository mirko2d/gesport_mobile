const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    contrasenia: { type: String, required: true },
    avatarUrl: { type: String },
    // Datos opcionales del perfil
    pesoKg: { type: Number },
    alturaCm: { type: Number },
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('contrasenia')) return next();
  const salt = await bcrypt.genSalt(10);
  this.contrasenia = await bcrypt.hash(this.contrasenia, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.contrasenia);
};

module.exports = mongoose.model('User', UserSchema);
