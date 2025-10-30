const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    estado: { type: String, enum: ['PENDIENTE', 'CONFIRMADA', 'CANCELADA'], default: 'PENDIENTE' },
    pago: {
      estado: { type: String, enum: ['NO_PAGO', 'PENDIENTE', 'APROBADO', 'RECHAZADO'], default: 'NO_PAGO' },
      referencia: String,
      monto: Number,
    },
  },
  { timestamps: true }
);

EnrollmentSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
