const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema(
  {
    posicion: Number,
    nombre: String,
    tiempo: String,
    dorsal: String,
    categoria: String,
    pais: String,
  },
  { _id: false }
);

const RaceSchema = new mongoose.Schema(
  {
    nombre: String, // e.g., "21K", "10K", "5K"
    horaInicio: String,
    clima: String,
    top10: [ResultSchema],
  },
  { _id: false }
);

const EditionSchema = new mongoose.Schema(
  {
    slug: { type: String, unique: true, index: true },
    anio: Number,
    fecha: String,
    lugar: String,
    descripcion: String,
    imagenPortada: String, // URL or local path reference
    galeria: [String],
    carreras: [RaceSchema],
    infoExtra: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Edition', EditionSchema);
