const express = require('express');
const Edition = require('../models/Edition');

const router = express.Router();

// Lista todas las ediciones (público)
router.get('/', async (req, res, next) => {
  try {
    const editions = await Edition.find().sort({ anio: -1 }).lean();
    res.json(editions);
  } catch (e) {
    next(e);
  }
});

// Obtener una edición por id o slug
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const ed = await Edition.findById(id).lean().catch(() => null) || await Edition.findOne({ slug: id }).lean();
    if (!ed) return res.status(404).json({ error: 'Edición no encontrada' });
    res.json(ed);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
