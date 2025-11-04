const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dorsal: { type: String },
    finishedAt: { type: Date, default: Date.now },
    timeMs: { type: Number },
    position: { type: Number, index: true },
    note: { type: String },
  },
  { timestamps: true }
);

// Unique dorsal per event (optional soft uniqueness)
ResultSchema.index({ event: 1, dorsal: 1 }, { unique: false, sparse: true });

module.exports = mongoose.model('Result', ResultSchema);
