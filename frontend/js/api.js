/* ── CONFIG ── */
const API_BASE = 'http://localhost:5000/api';

/* ── STATE ── */
const State = {
  user:  JSON.parse(localStorage.getItem('pulse_user') || 'null'),
  token: localStorage.getItem('pulse_token') || '',

  setAuth(token, user) {
    this.token  = token;
    this.user   = user;
    localStorage.setItem('pulse_token', token);
    localStorage.setItem('pulse_user',  JSON.stringify(user));
  },
  clearAuth() {
    this.token = '';
    this.user  = null;
    localStorage.removeItem('pulse_token');
    localStorage.removeItem('pulse_user');
  },
  get isLoggedIn() { return !!this.token && !!this.user; }
};

/* ── HTTP CLIENT ── */
async function http(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (State.token) headers['Authorization'] = `Bearer ${State.token}`;
  const res = await fetch(API_BASE + endpoint, {
    headers,
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

const get    = (url, params)  => http(url + (params ? '?' + new URLSearchParams(params) : ''));
const post   = (url, body)    => http(url, { method: 'POST',   body });
const put    = (url, body)    => http(url, { method: 'PUT',    body });
const del    = (url)          => http(url, { method: 'DELETE' });

/* ── API CALLS ── */
const API = {
  // Auth
  register:       (data)         => post('/auth/register', data),
  login:          (data)         => post('/auth/login', data),
  me:             ()             => get('/auth/me'),
  updateProfile:  (data)         => put('/auth/profile', data),

  // Posts
  feed:           (page = 1)     => get('/posts/feed',    { page }),
  explore:        (page = 1)     => get('/posts/explore', { page }),
  getPost:        (id)           => get(`/posts/${id}`),
  createPost:     (data)         => post('/posts', data),
  updatePost:     (id, data)     => put(`/posts/${id}`, data),
  deletePost:     (id)           => del(`/posts/${id}`),
  likePost:       (id)           => post(`/posts/${id}/like`),
  getComments:    (id)           => get(`/posts/${id}/comments`),
  addComment:     (id, data)     => post(`/posts/${id}/comments`, data),
  deleteComment:  (pid, cid)     => del(`/posts/${pid}/comments/${cid}`),
  likeComment:    (cid)          => post(`/posts/comments/${cid}/like`),
  notifications:  ()             => get('/posts/notifications'),
  unreadCount:    ()             => get('/posts/notifications/unread'),

  // Users
  getProfile:     (username)     => get(`/users/${username}`),
  getUserPosts:   (username, pg) => get(`/users/${username}/posts`, { page: pg || 1 }),
  follow:         (username)     => post(`/users/${username}/follow`),
  followers:      (username)     => get(`/users/${username}/followers`),
  following:      (username)     => get(`/users/${username}/following`),
  suggestions:    ()             => get('/users/suggestions'),
  search:         (q)            => get('/users/search', { q }),
};

/* ── TIME HELPERS ── */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return 'just now';
  const m = Math.floor(s  / 60);
  if (m < 60)   return `${m}m`;
  const h = Math.floor(m  / 60);
  if (h < 24)   return `${h}h`;
  const d = Math.floor(h  / 24);
  if (d < 7)    return `${d}d`;
  if (d < 30)   return `${Math.floor(d/7)}w`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── TOAST ── */
function toast(msg, type = 'info') {
  const icons = { success: '✓', error: '✕', info: 'i' };
  const container = document.getElementById('toast-container') ||
    (() => { const el = document.createElement('div'); el.id = 'toast-container'; el.className = 'toast-container'; document.body.appendChild(el); return el; })();

  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || 'i'}</span><span>${msg}</span>`;
  container.appendChild(el);

  setTimeout(() => {
    el.classList.add('exit');
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

/* ── MODAL ── */
function openModal(html) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-box">${html}</div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  const el = document.getElementById('modal-overlay');
  if (el) { el.remove(); document.body.style.overflow = ''; }
}

/* ── HTML HELPERS ── */
function avatarEl(url, alt, cls = 'avatar-md') {
  return `<img src="${url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${alt}`}"
               alt="${alt}" class="avatar ${cls}" loading="lazy">`;
}

function verifiedBadge(isVerified) {
  return isVerified ? '<span class="verified" title="Verified">✓</span>' : '';
}

function linkifyContent(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
}

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

/* ── REQUIRE AUTH GUARD ── */
function requireAuth(fn) {
  if (!State.isLoggedIn) { window.location.href = 'login.html'; return; }
  return fn();
}

/* ── REDIRECT IF AUTHED ── */
function redirectIfAuthed(dest = 'feed.html') {
  if (State.isLoggedIn) window.location.href = dest;
}

/* ── LOGOUT ── */
function logout() {
  State.clearAuth();
  window.location.href = 'login.html';
}

/* ── CLOSE DROPDOWNS ON OUTSIDE CLICK ── */
document.addEventListener('click', e => {
  document.querySelectorAll('.notif-panel, .user-dropdown, .search-dropdown').forEach(el => {
    if (!el.closest('[data-dropdown-parent]')?.contains(e.target)) {
      el.classList.remove('open');
    }
  });
});
