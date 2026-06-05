require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const multer  = require('multer');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer config
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename:    (_, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = Date.now() + '-' + Math.round(Math.random() * 1e6) + ext;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ['image/jpeg','image/jpg','image/png','image/gif','image/webp'];
    cb(null, allowed.includes(file.mimetype));
  }
});

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- UPDATED: Serve frontend files ---
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve uploaded images
app.use('/uploads', express.static(uploadDir));

// Import controllers & middleware
const auth    = require('./middleware/auth');
const A       = require('./controllers/authController');
const P       = require('./controllers/postController');
const U       = require('./controllers/userController');

// ── Auth routes ───────────────────────────────────
app.post('/api/auth/register', A.register);
app.post('/api/auth/login',    A.login);
app.get ('/api/auth/me',       auth, A.me);
app.put ('/api/auth/profile',  auth, A.updateProfile);
app.post('/api/auth/avatar',   auth, upload.single('avatar'), A.uploadAvatar);
app.post('/api/auth/cover',    auth, upload.single('cover'),  A.uploadCover);

// ── Post routes ───────────────────────────────────
app.get   ('/api/posts/feed',        auth, P.feed);
app.get   ('/api/posts/explore',     P.explore);
app.post  ('/api/posts',             auth, upload.single('image'), P.create);
app.delete('/api/posts/:id',         auth, P.remove);
app.post  ('/api/posts/:id/like',    auth, P.like);
app.get   ('/api/posts/:id/comments',      P.getComments);
app.post  ('/api/posts/:id/comments',auth, P.addComment);

// ── User routes ───────────────────────────────────
app.get ('/api/users/search',              U.search);
app.get ('/api/users/suggestions',   auth, U.suggestions);
app.get ('/api/users/:username',           U.profile);
app.get ('/api/users/:username/posts',     U.posts);
app.get ('/api/users/:username/followers', U.followers);
app.get ('/api/users/:username/following', U.following);
app.post('/api/users/:username/follow',auth, U.follow);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// --- UPDATED: Catch-all for frontend routing ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 404 (This will now only trigger if it's not a static file or an API route)
app.use((_, res) => res.status(404).json({ error: 'Route not found' }));

app.listen(PORT, () => {
  console.log(`\n🚀  Pulse API  →  http://localhost:${PORT}`);
  console.log(`📁  Uploads   →  http://localhost:${PORT}/uploads/<filename>\n`);
});