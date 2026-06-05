const db = require('../config/db');

const postQuery = (where, meId) => `
  SELECT p.*, u.username, u.full_name, u.avatar_url,
    (SELECT COUNT(*) FROM likes    WHERE post_id=p.id) AS like_count,
    (SELECT COUNT(*) FROM comments WHERE post_id=p.id) AS comment_count,
    (SELECT COUNT(*) FROM likes WHERE post_id=p.id AND user_id=${meId || 0}) AS liked_by_me
  FROM posts p JOIN users u ON u.id=p.user_id
  ${where}
  ORDER BY p.created_at DESC`;

// GET /api/posts/feed
exports.feed = async (req, res) => {
  const me = req.user.id;
  try {
    const [posts] = await db.query(postQuery(
      `WHERE p.user_id=? OR p.user_id IN (SELECT following_id FROM followers WHERE follower_id=?)`,
      me) + ' LIMIT 40', [me, me]);
    res.json(posts.map(p => ({ ...p, liked_by_me: !!p.liked_by_me })));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
};

// GET /api/posts/explore
exports.explore = async (req, res) => {
  const me = req.user?.id || 0;
  try {
    const [posts] = await db.query(postQuery('', me) + ' LIMIT 30');
    res.json(posts.map(p => ({ ...p, liked_by_me: !!p.liked_by_me })));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
};

// POST /api/posts  — supports file upload OR no image
exports.create = async (req, res) => {
  const content = req.body.content?.trim();
  if (!content) return res.status(400).json({ error: 'Content is required' });

  let image_url = '';
  if (req.file) image_url = `/uploads/${req.file.filename}`;

  try {
    const [r] = await db.query(
      'INSERT INTO posts (user_id, content, image_url) VALUES (?,?,?)',
      [req.user.id, content, image_url]
    );
    const [[post]] = await db.query(
      postQuery('WHERE p.id=?', req.user.id), [r.insertId]);
    res.status(201).json({ ...post, liked_by_me: false });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
};

// DELETE /api/posts/:id
exports.remove = async (req, res) => {
  try {
    const [[post]] = await db.query('SELECT user_id FROM posts WHERE id=?', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Not your post' });
    await db.query('DELETE FROM posts WHERE id=?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
};

// POST /api/posts/:id/like
exports.like = async (req, res) => {
  const me = req.user.id, pid = req.params.id;
  try {
    const [[ex]] = await db.query(
      'SELECT id FROM likes WHERE post_id=? AND user_id=?', [pid, me]);
    if (ex) {
      await db.query('DELETE FROM likes WHERE post_id=? AND user_id=?', [pid, me]);
    } else {
      await db.query('INSERT INTO likes (post_id,user_id) VALUES (?,?)', [pid, me]);
    }
    const [[{ cnt }]] = await db.query(
      'SELECT COUNT(*) AS cnt FROM likes WHERE post_id=?', [pid]);
    res.json({ liked: !ex, like_count: Number(cnt) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
};

// GET /api/posts/:id/comments
exports.getComments = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, u.username, u.full_name, u.avatar_url
      FROM comments c JOIN users u ON u.id=c.user_id
      WHERE c.post_id=? ORDER BY c.created_at ASC`, [req.params.id]);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
};

// POST /api/posts/:id/comments
exports.addComment = async (req, res) => {
  const content = req.body.content?.trim();
  if (!content) return res.status(400).json({ error: 'Comment cannot be empty' });
  try {
    const [r] = await db.query(
      'INSERT INTO comments (post_id,user_id,content) VALUES (?,?,?)',
      [req.params.id, req.user.id, content]);
    const [[c]] = await db.query(`
      SELECT c.*, u.username, u.full_name, u.avatar_url
      FROM comments c JOIN users u ON u.id=c.user_id WHERE c.id=?`, [r.insertId]);
    res.status(201).json(c);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
};
