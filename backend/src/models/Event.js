const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true },
    descripcion: String,
    fecha: Date,
    lugar: String,
    categoria: { type: String, enum: ['CARRERA', 'ENTRENAMIENTO', 'OTRO'], default: 'CARRERA' },
    afiche: String, // URL de imagen
    cupos: Number,
    precio: Number,
    activo: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', EventSchema);
