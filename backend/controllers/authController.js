const jwt = require('jsonwebtoken');
const db  = require('../config/db');

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const safeUser = (u) => ({
  id: u.id, username: u.username, email: u.email,
  full_name: u.full_name, bio: u.bio, avatar_url: u.avatar_url,
  cover_url: u.cover_url || '', created_at: u.created_at
});

// POST /api/auth/register
exports.register = async (req, res) => {
  const { username, email, password, full_name } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'Username, email and password are required' });
  try {
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
    const [r] = await db.query(
      'INSERT INTO users (username,email,password,full_name,avatar_url) VALUES (?,?,?,?,?)',
      [username.toLowerCase().trim(), email.toLowerCase().trim(), password, full_name || username, avatar]
    );
    const [[user]] = await db.query('SELECT * FROM users WHERE id=?', [r.insertId]);
    res.status(201).json({ token: makeToken(user.id), user: safeUser(user) });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Username or email already taken' });
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required' });
  try {
    const [[user]] = await db.query(
      'SELECT * FROM users WHERE username=? OR email=?',
      [username.toLowerCase().trim(), username.toLowerCase().trim()]
    );
    if (!user || user.password !== password)
      return res.status(401).json({ error: 'Invalid username or password' });
    res.json({ token: makeToken(user.id), user: safeUser(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed' });
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  try {
    const [[user]] = await db.query(`
      SELECT u.*,
        (SELECT COUNT(*) FROM posts     WHERE user_id=u.id)      AS posts,
        (SELECT COUNT(*) FROM followers WHERE following_id=u.id) AS followers,
        (SELECT COUNT(*) FROM followers WHERE follower_id=u.id)  AS following
      FROM users u WHERE u.id=?`, [req.user.id]);
    res.json({ ...safeUser(user), posts: user.posts, followers: user.followers, following: user.following });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
};

// PUT /api/auth/profile  (text fields)
exports.updateProfile = async (req, res) => {
  const { full_name, bio } = req.body;
  try {
    await db.query('UPDATE users SET full_name=?, bio=? WHERE id=?',
      [full_name || '', bio || '', req.user.id]);
    const [[user]] = await db.query('SELECT * FROM users WHERE id=?', [req.user.id]);
    res.json(safeUser(user));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Update failed' });
  }
};

// POST /api/auth/avatar  (file upload)
exports.uploadAvatar = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  try {
    await db.query('UPDATE users SET avatar_url=? WHERE id=?', [url, req.user.id]);
    res.json({ avatar_url: url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Upload failed' });
  }
};

// POST /api/auth/cover  (file upload)
exports.uploadCover = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  try {
    await db.query('UPDATE users SET cover_url=? WHERE id=?', [url, req.user.id]);
    res.json({ cover_url: url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Upload failed' });
  }
};
