const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const AVATAR_DIR = path.join(UPLOAD_ROOT, 'avatars');
const EVENTS_DIR = path.join(UPLOAD_ROOT, 'events');
const NEWS_DIR = path.join(UPLOAD_ROOT, 'news');

// Ensure folders exist
for (const dir of [UPLOAD_ROOT, AVATAR_DIR, EVENTS_DIR, NEWS_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Route-based destination: if path contains 'event' use events dir, if contains 'news' use news dir
    if (req.path.includes('event')) return cb(null, EVENTS_DIR);
    if (req.path.includes('news')) return cb(null, NEWS_DIR);
    cb(null, AVATAR_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({ storage });

// POST /upload/avatar -> returns { url }
router.post('/avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const filename = req.file.filename;
  const publicPath = `/uploads/avatars/${filename}`; // served statically
  const fullUrl = `${req.protocol}://${req.get('host')}${publicPath}`;
  res.json({ url: fullUrl });
});

module.exports = router;

// POST /upload/event -> returns { url }
router.post('/event', upload.single('poster'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const filename = req.file.filename;
  const publicPath = `/uploads/events/${filename}`;
  const fullUrl = `${req.protocol}://${req.get('host')}${publicPath}`;
  res.json({ url: fullUrl });
});

// POST /upload/news -> returns { url }
router.post('/news', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const filename = req.file.filename;
  const publicPath = `/uploads/news/${filename}`;
  const fullUrl = `${req.protocol}://${req.get('host')}${publicPath}`;
  res.json({ url: fullUrl });
});
