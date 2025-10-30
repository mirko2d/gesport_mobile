const express = require('express');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Por ahora devolvemos un arreglo vacío. Puedes mapear resultados reales más adelante.
router.get('/mine', authRequired, async (req, res) => {
  res.json([]);
});

module.exports = router;
