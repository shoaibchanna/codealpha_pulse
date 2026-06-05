const r    = require('express').Router();
const auth = require('../middleware/auth');
const A    = require('../controllers/authController');
const P    = require('../controllers/postController');
const U    = require('../controllers/userController');

r.post('/auth/register', A.register);
r.post('/auth/login',    A.login);
r.get ('/auth/me',       auth, A.me);
r.put ('/auth/profile',  auth, A.updateProfile);

r.get ('/posts/feed',          auth, P.feed);
r.get ('/posts/explore',             P.explore);
r.post('/posts',               auth, P.create);
r.delete('/posts/:id',         auth, P.remove);
r.post('/posts/:id/like',      auth, P.like);
r.get ('/posts/:id/comments',        P.getComments);
r.post('/posts/:id/comments',  auth, P.addComment);

r.get ('/users/search',              U.search);
r.get ('/users/suggestions',   auth, U.suggestions);
r.get ('/users/:username',           U.profile);
r.get ('/users/:username/posts',     U.posts);
r.post('/users/:username/follow',auth, U.follow);

module.exports = r;
