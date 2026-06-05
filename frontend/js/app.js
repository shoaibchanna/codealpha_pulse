/* ============================================
   app.js — shared across all Pulse pages
   ============================================ */

const API_BASE = 'http://localhost:5000';
const API      = API_BASE + '/api';

/* ── Auth state ──────────────────────── */
const Auth = {
  get token()   { return localStorage.getItem('pulse_token') || ''; },
  get user()    { return JSON.parse(localStorage.getItem('pulse_user') || 'null'); },
  set(tok, usr) { localStorage.setItem('pulse_token', tok); localStorage.setItem('pulse_user', JSON.stringify(usr)); },
  clear()       { localStorage.removeItem('pulse_token'); localStorage.removeItem('pulse_user'); },
  get loggedIn(){ return !!(this.token && this.user); }
};

/* ── HTTP helpers ────────────────────── */
async function apiCall(method, url, body, isFormData) {
  const headers = {};
  if (Auth.token) headers['Authorization'] = 'Bearer ' + Auth.token;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);

  const res  = await fetch(API + url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}
const apiGet    = (url)         => apiCall('GET',    url);
const apiPost   = (url, body)   => apiCall('POST',   url, body);
const apiPut    = (url, body)   => apiCall('PUT',    url, body);
const apiDelete = (url)         => apiCall('DELETE', url);
const apiForm   = (url, fd)     => apiCall('POST',   url, fd, true);

/* ── Toast notifications ─────────────── */
function toast(msg, type) {
  type = type || 'info';
  let wrap = document.getElementById('toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  el.textContent = (icons[type] || '') + ' ' + msg;
  wrap.appendChild(el);
  setTimeout(function() {
    el.style.opacity = '0';
    el.style.transform = 'translateX(80px)';
    setTimeout(function() { el.remove(); }, 300);
  }, 3000);
}

/* ── Utility helpers ─────────────────── */
function timeAgo(dt) {
  var s = Math.floor((Date.now() - new Date(dt)) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

function avatarUrl(url, username) {
  if (url && url.trim() !== '') {
    // local upload path
    if (url.startsWith('/uploads/')) return API_BASE + url;
    return url;
  }
  return 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (username || 'user');
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Convert #hashtags to styled spans (safe — content is already escaped)
function linkifyText(raw) {
  var safe = esc(raw);
  return safe.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
}

function goTo(page) { window.location.href = page; }

function requireLogin() {
  if (!Auth.loggedIn) { goTo('login.html'); return false; }
  return true;
}

/* ── Modal ───────────────────────────── */
function showModal(html) {
  closeModal();
  var bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.id = 'modal-bg';
  var box = document.createElement('div');
  box.className = 'modal-box';
  box.innerHTML = html;
  bg.appendChild(box);
  bg.addEventListener('click', function(e) { if (e.target === bg) closeModal(); });
  document.body.appendChild(bg);
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  var el = document.getElementById('modal-bg');
  if (el) { el.remove(); document.body.style.overflow = ''; }
}

/* ── Post card HTML ──────────────────── */
function buildPostCard(p) {
  var mine  = Auth.loggedIn && Auth.user && Auth.user.id === p.user_id;
  var liked = !!p.liked_by_me;
  var imgHtml = '';
  if (p.image_url && p.image_url.trim() !== '') {
    var src = p.image_url.startsWith('/uploads/') ? API_BASE + p.image_url : p.image_url;
    imgHtml = '<img src="' + esc(src) + '" class="post-img" loading="lazy" alt="Post image" onerror="this.style.display=\'none\'">';
  }

  var deleteBtn = mine
    ? '<button class="post-delete-btn" onclick="deletePost(' + p.id + ')" title="Delete post">🗑</button>'
    : '';

  return [
    '<div class="card post-card" id="post-' + p.id + '">',
      '<div class="post-header">',
        '<img src="' + esc(avatarUrl(p.avatar_url, p.username)) + '" class="post-avatar" ',
          'onclick="goTo(\'profile.html?u=' + esc(p.username) + '\')" alt="">',
        '<div class="post-author-info">',
          '<div>',
            '<span class="post-author-name" onclick="goTo(\'profile.html?u=' + esc(p.username) + '\')">' + esc(p.full_name) + '</span>',
            ' <span class="post-author-handle">@' + esc(p.username) + '</span>',
          '</div>',
          '<div class="post-time">' + timeAgo(p.created_at) + '</div>',
        '</div>',
        deleteBtn,
      '</div>',
      '<div class="post-content">' + linkifyText(p.content) + '</div>',
      imgHtml,
      '<div class="post-actions">',
        '<button class="post-action-btn ' + (liked ? 'liked' : '') + '" id="like-btn-' + p.id + '" onclick="handleLike(' + p.id + ')">',
          '<span class="action-icon">' + (liked ? '❤️' : '🤍') + '</span>',
          ' <span id="like-cnt-' + p.id + '">' + (p.like_count || 0) + '</span>',
        '</button>',
        '<button class="post-action-btn" onclick="toggleComments(' + p.id + ')">',
          '<span class="action-icon">💬</span>',
          ' <span id="cmt-cnt-' + p.id + '">' + (p.comment_count || 0) + '</span>',
        '</button>',
      '</div>',
      '<div class="comments-area" id="comments-' + p.id + '" style="display:none">',
        buildCommentCompose(p.id),
        '<div id="clist-' + p.id + '"></div>',
      '</div>',
    '</div>'
  ].join('');
}

function buildCommentCompose(postId) {
  if (!Auth.loggedIn) return '';
  return [
    '<div class="comment-compose-row">',
      '<img src="' + esc(avatarUrl(Auth.user.avatar_url, Auth.user.username)) + '" class="avatar-sm" alt="">',
      '<input class="comment-input" id="cinput-' + postId + '" placeholder="Write a comment…"',
        ' onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();submitComment(' + postId + ')}">',
      '<button class="comment-send-btn" onclick="submitComment(' + postId + ')">➤</button>',
    '</div>'
  ].join('');
}

function buildCommentHtml(c) {
  return [
    '<div class="comment-item" id="comment-' + c.id + '">',
      '<img src="' + esc(avatarUrl(c.avatar_url, c.username)) + '" class="comment-avatar" alt=""',
        ' onclick="goTo(\'profile.html?u=' + esc(c.username) + '\')">',
      '<div class="comment-bubble">',
        '<div class="comment-meta">',
          '<span class="comment-author" onclick="goTo(\'profile.html?u=' + esc(c.username) + '\')">' + esc(c.full_name) + '</span>',
          '<span class="comment-time">' + timeAgo(c.created_at) + '</span>',
        '</div>',
        '<div class="comment-text">' + esc(c.content) + '</div>',
      '</div>',
    '</div>'
  ].join('');
}

/* ── Post interactions ───────────────── */
async function handleLike(id) {
  if (!requireLogin()) return;
  try {
    var r   = await apiPost('/posts/' + id + '/like');
    var btn = document.getElementById('like-btn-' + id);
    var cnt = document.getElementById('like-cnt-' + id);
    if (!btn) return;
    btn.classList.toggle('liked', r.liked);
    btn.querySelector('.action-icon').textContent = r.liked ? '❤️' : '🤍';
    if (cnt) cnt.textContent = r.like_count;
  } catch (e) { toast('Failed to like', 'error'); }
}

async function toggleComments(id) {
  var area = document.getElementById('comments-' + id);
  if (!area) return;
  var isOpen = area.style.display !== 'none';
  area.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) await loadComments(id);
}

async function loadComments(id) {
  var list = document.getElementById('clist-' + id);
  if (!list) return;
  list.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
  try {
    var comments = await apiGet('/posts/' + id + '/comments');
    if (!comments.length) {
      list.innerHTML = '<p style="color:var(--text3);font-size:.82rem;padding:.4rem 0">No comments yet. Be the first!</p>';
      return;
    }
    list.innerHTML = comments.map(buildCommentHtml).join('');
  } catch { list.innerHTML = '<p style="color:var(--text3);font-size:.82rem">Failed to load comments</p>'; }
}

async function submitComment(postId) {
  if (!requireLogin()) return;
  var input = document.getElementById('cinput-' + postId);
  if (!input) return;
  var text = input.value.trim();
  if (!text) return;
  try {
    var c    = await apiPost('/posts/' + postId + '/comments', { content: text });
    input.value = '';
    var list  = document.getElementById('clist-' + postId);
    var empty = list ? list.querySelector('p') : null;
    if (empty) list.innerHTML = '';
    if (list) list.insertAdjacentHTML('beforeend', buildCommentHtml(c));
    var cnt = document.getElementById('cmt-cnt-' + postId);
    if (cnt) cnt.textContent = parseInt(cnt.textContent || 0) + 1;
  } catch (e) { toast(e.error || 'Failed to post comment', 'error'); }
}

async function deletePost(id) {
  if (!confirm('Delete this post? This cannot be undone.')) return;
  try {
    await apiDelete('/posts/' + id);
    var el = document.getElementById('post-' + id);
    if (el) el.remove();
    toast('Post deleted', 'success');
  } catch (e) { toast(e.error || 'Failed to delete', 'error'); }
}

/* ── Navbar ──────────────────────────── */
function buildNavbar(activePage) {
  var root = document.getElementById('navbar');
  if (!root) return;

  var logoHref = Auth.loggedIn ? 'feed.html' : '../index.html';

  var authSection = Auth.loggedIn
    ? '<button class="nav-icon-btn" onclick="goTo(\'feed.html\')" title="Home" ' +
        (activePage === 'feed' ? 'style="background:var(--blue-lt);color:var(--blue);border-color:var(--blue)"' : '') + '>🏠</button>' +
      '<button class="nav-icon-btn" onclick="goTo(\'explore.html\')" title="Explore" ' +
        (activePage === 'explore' ? 'style="background:var(--blue-lt);color:var(--blue);border-color:var(--blue)"' : '') + '>🔭</button>' +
      '<button class="nav-icon-btn" onclick="openCompose()" title="New Post">✏️</button>' +
      '<img src="' + esc(avatarUrl(Auth.user.avatar_url, Auth.user.username)) + '" class="nav-avatar" ' +
        'onclick="goTo(\'profile.html?u=' + esc(Auth.user.username) + '\')" title="My Profile" alt="me">' +
      '<button class="btn btn-ghost btn-sm" onclick="doLogout()">Sign Out</button>'
    : '<a href="login.html" class="btn btn-ghost btn-sm">Sign In</a>' +
      '<a href="register.html" class="btn btn-primary btn-sm">Join</a>';

  root.innerHTML =
    '<span class="nav-logo" onclick="goTo(\'' + logoHref + '\')">Pulse ✨</span>' +
    '<div class="nav-search">' +
      '<span class="search-icon">🔍</span>' +
      '<input type="text" id="nav-search-input" placeholder="Search people…" autocomplete="off">' +
    '</div>' +
    '<div class="nav-right">' + authSection + '</div>';

  // Wire up search
  var inp = document.getElementById('nav-search-input');
  if (inp) {
    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && this.value.trim()) {
        goTo('explore.html?q=' + encodeURIComponent(this.value.trim()));
      }
    });
  }
}

function doLogout() {
  Auth.clear();
  toast('Signed out successfully', 'success');
  setTimeout(function() { goTo('login.html'); }, 500);
}

/* ── Compose post modal ──────────────── */
function openCompose() {
  if (!requireLogin()) return;
  showModal(
    '<div class="modal-header">' +
      '<span class="modal-title">✏️ Create Post</span>' +
      '<button class="modal-close" onclick="closeModal()">✕</button>' +
    '</div>' +
    '<div style="display:flex;gap:.7rem;align-items:flex-start;margin-bottom:.85rem">' +
      '<img src="' + esc(avatarUrl(Auth.user.avatar_url, Auth.user.username)) + '" class="avatar-md" alt="">' +
      '<textarea class="form-input" id="modal-post-text" rows="4" ' +
        'placeholder="What\'s on your mind?" style="flex:1;border-radius:12px"></textarea>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">📷 Attach Image (optional)</label>' +
      '<input type="file" id="modal-post-file" accept="image/*" class="form-input" style="padding:.4rem">' +
    '</div>' +
    '<div style="display:flex;justify-content:flex-end;gap:.6rem;margin-top:1rem">' +
      '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-primary" onclick="submitComposePost()">Post ✨</button>' +
    '</div>'
  );
  document.getElementById('modal-post-text').focus();
}

async function submitComposePost() {
  var text = document.getElementById('modal-post-text').value.trim();
  if (!text) { toast('Write something first!', 'error'); return; }

  var fd = new FormData();
  fd.append('content', text);
  var fileInput = document.getElementById('modal-post-file');
  if (fileInput && fileInput.files[0]) fd.append('image', fileInput.files[0]);

  try {
    var p = await apiForm('/posts', fd);
    closeModal();
    toast('Posted! 🎉', 'success');
    var feed = document.getElementById('feed-container');
    if (feed) feed.insertAdjacentHTML('afterbegin', buildPostCard(p));
  } catch (e) { toast(e.error || 'Failed to post', 'error'); }
}
