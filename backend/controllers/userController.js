const db = require('../config/db');

// GET /api/users/:username
exports.profile = async (req, res) => {
  const me = req.user?.id || 0;
  try {
    const [[u]] = await db.query(`
      SELECT u.id, u.username, u.full_name, u.bio, u.avatar_url, u.cover_url, u.created_at,
        (SELECT COUNT(*) FROM posts     WHERE user_id=u.id)                            AS posts,
        (SELECT COUNT(*) FROM followers WHERE following_id=u.id)                       AS followers,
        (SELECT COUNT(*) FROM followers WHERE follower_id=u.id)                        AS following,
        (SELECT COUNT(*) FROM followers WHERE follower_id=? AND following_id=u.id)     AS i_follow
      FROM users u WHERE u.username=?`, [me, req.params.username]);
    if (!u) return res.status(404).json({ error: 'User not found' });
    res.json({ ...u, i_follow: !!u.i_follow });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
};

// GET /api/users/:username/posts
exports.posts = async (req, res) => {
  const me = req.user?.id || 0;
  try {
    const [[owner]] = await db.query('SELECT id FROM users WHERE username=?', [req.params.username]);
    if (!owner) return res.status(404).json({ error: 'User not found' });
    const [posts] = await db.query(`
      SELECT p.*, u.username, u.full_name, u.avatar_url,
        (SELECT COUNT(*) FROM likes    WHERE post_id=p.id)                       AS like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id=p.id)                       AS comment_count,
        (SELECT COUNT(*) FROM likes WHERE post_id=p.id AND user_id=?)            AS liked_by_me
      FROM posts p JOIN users u ON u.id=p.user_id
      WHERE p.user_id=? ORDER BY p.created_at DESC`, [me, owner.id]);
    res.json(posts.map(p => ({ ...p, liked_by_me: !!p.liked_by_me })));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
};

// POST /api/users/:username/follow  (toggle)
exports.follow = async (req, res) => {
  const me = req.user.id;
  try {
    const [[target]] = await db.query('SELECT id FROM users WHERE username=?', [req.params.username]);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.id === me) return res.status(400).json({ error: 'Cannot follow yourself' });
    const [[ex]] = await db.query(
      'SELECT id FROM followers WHERE follower_id=? AND following_id=?', [me, target.id]);
    if (ex) {
      await db.query('DELETE FROM followers WHERE follower_id=? AND following_id=?', [me, target.id]);
    } else {
      await db.query('INSERT INTO followers (follower_id,following_id) VALUES (?,?)', [me, target.id]);
    }
    res.json({ following: !ex });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
};

// GET /api/users/:username/followers
exports.followers = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.username, u.full_name, u.avatar_url, u.bio
      FROM followers f JOIN users u ON u.id=f.follower_id
      WHERE f.following_id=(SELECT id FROM users WHERE username=?)
      ORDER BY f.created_at DESC`, [req.params.username]);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
};

// GET /api/users/:username/following
exports.following = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.username, u.full_name, u.avatar_url, u.bio
      FROM followers f JOIN users u ON u.id=f.following_id
      WHERE f.follower_id=(SELECT id FROM users WHERE username=?)
      ORDER BY f.created_at DESC`, [req.params.username]);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
};

// GET /api/users/search?q=
exports.search = async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 1) return res.json([]);
  try {
    const [rows] = await db.query(
      'SELECT id,username,full_name,avatar_url,bio FROM users WHERE username LIKE ? OR full_name LIKE ? LIMIT 10',
      [`%${q}%`, `%${q}%`]);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
};

// GET /api/users/suggestions
exports.suggestions = async (req, res) => {
  const me = req.user.id;
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.username, u.full_name, u.avatar_url, u.bio
      FROM users u
      WHERE u.id != ?
        AND u.id NOT IN (SELECT following_id FROM followers WHERE follower_id=?)
      ORDER BY u.id DESC LIMIT 5`, [me, me]);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
};
