const express = require('express');
const { authRequired, requireRole } = require('../middleware/auth');
const News = require('../models/News');

const router = express.Router();

// Public: list published news (newest first)
router.get('/', async (req, res, next) => {
  try {
    const items = await News.find({ published: true }).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (e) {
    next(e);
  }
});

// Superadmin: create news
router.post('/', authRequired, requireRole(['superadmin']), async (req, res, next) => {
  try {
    const { title, content, imageUrl, published = true } = req.body || {};
    if (!title || !content) return res.status(400).json({ error: 'title y content requeridos' });
    const item = await News.create({ title, content, imageUrl, published, createdBy: req.user._id });
    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

// Superadmin: delete news
router.delete('/:id', authRequired, requireRole(['superadmin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    await News.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Superadmin: list my own news (any publish state)
router.get('/mine', authRequired, requireRole(['superadmin']), async (req, res, next) => {
  try {
    const items = await News.find({ createdBy: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
