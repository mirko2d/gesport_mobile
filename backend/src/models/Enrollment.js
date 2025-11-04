const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    estado: { type: String, enum: ['PENDIENTE', 'CONFIRMADA', 'CANCELADA'], default: 'PENDIENTE' },
    pago: {
      estado: { type: String, enum: ['NO_PAGO', 'PENDIENTE', 'APROBADO', 'RECHAZADO'], default: 'NO_PAGO' },
      referencia: String, // id de pago del proveedor
      monto: Number,
      moneda: { type: String, default: 'ARS' },
      proveedor: { type: String, default: 'ninguno' },
      preferenciaId: String,
      initPoint: String,
      reciboUrl: String,
      pagadoEn: Date,
    },
    form: {
      dni: String,
      fechaNacimiento: Date,
      genero: { type: String, enum: ['F', 'M', 'X', 'Otro'], default: 'X' },
      tallaRemera: { type: String, enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
      emergencia: {
        nombre: String,
        telefono: String,
        relacion: String,
      },
      salud: {
        alergias: String,
        condiciones: String,
        medicamentos: String,
      },
      club: String,
      ciudad: String,
      pais: String,
      aceptoTerminos: { type: Boolean, default: false },
      aceptoDescargo: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

EnrollmentSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
