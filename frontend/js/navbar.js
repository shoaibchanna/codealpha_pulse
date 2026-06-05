/* navbar.js — injected into every page that has id="navbar-root" */

function renderNavbar() {
  const root = document.getElementById('navbar-root');
  if (!root) return;

  root.innerHTML = `
    <nav class="navbar">
      <span class="nav-brand" onclick="window.location.href='feed.html'">Pulse</span>

      <div class="nav-search" data-dropdown-parent>
        <span class="nav-search-icon">🔍</span>
        <input type="text" id="nav-search-input" placeholder="Search people…" autocomplete="off">
        <div class="search-dropdown" id="search-dropdown"></div>
      </div>

      <div class="nav-actions">
        ${State.isLoggedIn ? `
          <div style="position:relative" data-dropdown-parent>
            <button class="icon-btn" id="notif-btn" title="Notifications">
              🔔
              <span class="notif-badge" id="notif-badge" style="display:none">0</span>
            </button>
            <div class="notif-panel" id="notif-panel">
              <div class="notif-header">
                <h3>Notifications</h3>
                <button class="btn btn-ghost btn-sm" onclick="document.getElementById('notif-panel').classList.remove('open')">✕</button>
              </div>
              <div id="notif-list"><div class="spinner-wrap"><div class="spinner"></div></div></div>
            </div>
          </div>

          <button class="icon-btn" title="New Post" onclick="openComposeModal()">✏️</button>

          <div style="position:relative" data-dropdown-parent>
            <button class="nav-avatar-btn" id="user-menu-btn">
              ${avatarEl(State.user?.avatar_url, State.user?.username, 'avatar-sm')}
            </button>
            <div class="user-dropdown" id="user-dropdown">
              <div class="dropdown-item" onclick="window.location.href='profile.html?u=${State.user?.username}'">
                👤 Profile
              </div>
              <div class="dropdown-item" onclick="openEditProfile()">
                ✏️ Edit Profile
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item danger" onclick="logout()">
                ↩ Sign Out
              </div>
            </div>
          </div>
        ` : `
          <div class="nav-auth-cta">
            <a href="login.html"    class="btn btn-ghost    btn-sm">Sign In</a>
            <a href="register.html" class="btn btn-primary  btn-sm">Join Free</a>
          </div>
        `}
      </div>
    </nav>
  `;

  /* Search */
  const searchInput = document.getElementById('nav-search-input');
  const searchDrop  = document.getElementById('search-dropdown');
  let searchTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = searchInput.value.trim();
    if (q.length < 2) { searchDrop.classList.remove('open'); return; }
    searchTimer = setTimeout(async () => {
      try {
        const users = await API.search(q);
        if (!users.length) { searchDrop.classList.remove('open'); return; }
        searchDrop.innerHTML = users.map(u => `
          <div class="search-result-item" onclick="window.location.href='profile.html?u=${u.username}'">
            ${avatarEl(u.avatar_url, u.username, 'avatar-sm')}
            <div>
              <div style="font-size:.875rem;font-weight:600">${u.display_name} ${verifiedBadge(u.is_verified)}</div>
              <div style="font-size:.75rem;color:var(--text-muted)">@${u.username}</div>
            </div>
          </div>
        `).join('');
        searchDrop.classList.add('open');
      } catch {}
    }, 320);
  });

  /* Notifications toggle */
  document.getElementById('notif-btn')?.addEventListener('click', async () => {
    const panel = document.getElementById('notif-panel');
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) await loadNotifications();
  });

  /* User menu toggle */
  document.getElementById('user-menu-btn')?.addEventListener('click', () => {
    document.getElementById('user-dropdown').classList.toggle('open');
  });

  /* Unread badge */
  if (State.isLoggedIn) loadUnreadCount();
}

async function loadNotifications() {
  const list = document.getElementById('notif-list');
  try {
    const notifs = await API.notifications();
    document.getElementById('notif-badge').style.display = 'none';
    if (!notifs.length) {
      list.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:2rem;font-size:.875rem">No notifications yet</p>';
      return;
    }
    const icons = { like: '❤️', comment: '💬', follow: '👤', mention: '@' };
    const msgs  = {
      like:    (n) => `<strong>${n.actor_name}</strong> liked your post`,
      comment: (n) => `<strong>${n.actor_name}</strong> commented on your post`,
      follow:  (n) => `<strong>${n.actor_name}</strong> started following you`,
      mention: (n) => `<strong>${n.actor_name}</strong> mentioned you`,
    };
    list.innerHTML = notifs.map(n => `
      <div class="notif-item ${n.is_read ? '' : 'unread'}">
        ${avatarEl(n.actor_avatar, n.actor_username, 'avatar-sm')}
        <div style="flex:1">
          <div class="notif-text">${(msgs[n.type] || (() => ''))(n)}</div>
          <div class="notif-time">${timeAgo(n.created_at)}</div>
        </div>
        <div class="notif-icon ${n.type}">${icons[n.type] || '🔔'}</div>
      </div>
    `).join('');
  } catch {
    list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:1.5rem">Failed to load</p>';
  }
}

async function loadUnreadCount() {
  try {
    const { count } = await API.unreadCount();
    const badge = document.getElementById('notif-badge');
    if (badge) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  } catch {}
}

function openComposeModal() {
  if (!State.isLoggedIn) { window.location.href = 'login.html'; return; }
  openModal(`
    <div class="modal-header">
      <span class="modal-title">Create Post</span>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="display:flex;gap:.75rem;align-items:flex-start">
      ${avatarEl(State.user?.avatar_url, State.user?.username, 'avatar-md')}
      <div style="flex:1">
        <textarea id="modal-compose-text" class="compose-input" placeholder="What's on your mind?" style="width:100%;min-height:120px"></textarea>
        <div id="modal-compose-img-wrap" style="margin-top:.75rem">
          <input type="text" class="form-input" id="modal-compose-img" placeholder="Image URL (optional)">
        </div>
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:.75rem;margin-top:1.25rem">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitModalPost()">Post</button>
    </div>
  `);
  document.getElementById('modal-compose-text')?.focus();
}

async function submitModalPost() {
  const content   = document.getElementById('modal-compose-text')?.value.trim();
  const image_url = document.getElementById('modal-compose-img')?.value.trim();
  if (!content) { toast('Write something first!', 'error'); return; }
  try {
    const post = await API.createPost({ content, image_url: image_url || null });
    closeModal();
    toast('Posted! 🎉', 'success');
    // If on feed page, prepend post
    const feedEl = document.getElementById('feed-container');
    if (feedEl) feedEl.insertAdjacentHTML('afterbegin', buildPostCard(post));
  } catch (e) {
    toast(e.error || 'Failed to post', 'error');
  }
}

function openEditProfile() {
  if (!State.user) return;
  const u = State.user;
  openModal(`
    <div class="modal-header">
      <span class="modal-title">Edit Profile</span>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <form class="auth-form" id="edit-profile-form" onsubmit="submitEditProfile(event)">
      <div class="form-group">
        <label class="form-label">Display Name</label>
        <input class="form-input" id="ep-name" value="${u.display_name || ''}" placeholder="Your name">
      </div>
      <div class="form-group">
        <label class="form-label">Bio</label>
        <textarea class="form-input" id="ep-bio" rows="3" placeholder="Tell people about yourself">${u.bio || ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Website</label>
        <input class="form-input" id="ep-website" value="${u.website || ''}" placeholder="https://...">
      </div>
      <div class="form-group">
        <label class="form-label">Location</label>
        <input class="form-input" id="ep-location" value="${u.location || ''}" placeholder="City, Country">
      </div>
      <button type="submit" class="btn btn-primary btn-full">Save Changes</button>
    </form>
  `);
}

async function submitEditProfile(e) {
  e.preventDefault();
  try {
    const updated = await API.updateProfile({
      display_name: document.getElementById('ep-name').value,
      bio:          document.getElementById('ep-bio').value,
      website:      document.getElementById('ep-website').value,
      location:     document.getElementById('ep-location').value,
    });
    State.setAuth(State.token, { ...State.user, ...updated });
    closeModal();
    toast('Profile updated!', 'success');
    if (typeof onProfileUpdated === 'function') onProfileUpdated(updated);
  } catch (e) {
    toast(e.error || 'Update failed', 'error');
  }
}

/* ── POST CARD BUILDER (shared across pages) ── */
function buildPostCard(p) {
  const isOwn = State.user?.id === p.user_id;
  return `
    <div class="card post-card" id="post-${p.id}" data-post-id="${p.id}" style="animation-delay:${Math.random()*0.12}s">
      <div class="post-header">
        <img src="${p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`}"
             alt="${p.username}" class="avatar avatar-md" loading="lazy">
        <div class="post-author-info">
          <div class="post-author-name" onclick="window.location.href='profile.html?u=${p.username}'">
            ${p.display_name} ${verifiedBadge(p.is_verified)}
          </div>
          <div style="display:flex;align-items:center;gap:.4rem">
            <span class="post-author-handle">@${p.username}</span>
            <span class="post-time">· ${timeAgo(p.created_at)}</span>
          </div>
        </div>
        ${isOwn ? `
        <div style="position:relative" data-dropdown-parent>
          <button class="post-more" onclick="togglePostMenu(${p.id})">···</button>
          <div class="user-dropdown" id="post-menu-${p.id}" style="right:0;top:36px;width:160px">
            <div class="dropdown-item" onclick="editPost(${p.id})">✏️ Edit</div>
            <div class="dropdown-item danger" onclick="deletePost(${p.id})">🗑 Delete</div>
          </div>
        </div>` : ''}
      </div>

      ${p.is_edited ? '<div class="post-edited-tag">· edited</div>' : ''}
      <div class="post-content">${linkifyContent(p.content)}</div>
      ${p.image_url ? `<img src="${p.image_url}" alt="Post image" class="post-image" loading="lazy">` : ''}

      <div class="post-actions">
        <button class="post-action-btn ${p.viewer_liked ? 'liked' : ''}"
                id="like-btn-${p.id}" onclick="handleLike(${p.id}, this)">
          <span class="action-icon">${p.viewer_liked ? '❤️' : '🤍'}</span>
          <span id="like-count-${p.id}">${formatNumber(p.like_count || 0)}</span>
        </button>
        <button class="post-action-btn" onclick="toggleComments(${p.id})">
          <span class="action-icon">💬</span>
          <span id="comment-count-${p.id}">${formatNumber(p.comment_count || 0)}</span>
        </button>
        <button class="post-action-btn" onclick="sharePost(${p.id})">
          <span class="action-icon">↗</span>
        </button>
      </div>

      <div class="comments-section" id="comments-${p.id}" style="display:none">
        ${State.isLoggedIn ? `
          <div class="comment-compose">
            ${avatarEl(State.user?.avatar_url, State.user?.username, 'avatar-sm')}
            <input class="comment-input" placeholder="Write a comment…"
                   id="comment-input-${p.id}"
                   onkeydown="handleCommentKey(event,${p.id})">
            <button class="btn btn-primary btn-sm" onclick="submitComment(${p.id})">→</button>
          </div>
        ` : ''}
        <div id="comments-list-${p.id}">
          <div class="spinner-wrap"><div class="spinner"></div></div>
        </div>
      </div>
    </div>
  `;
}

function togglePostMenu(id) {
  document.getElementById(`post-menu-${id}`)?.classList.toggle('open');
}

async function handleLike(postId, btn) {
  if (!State.isLoggedIn) { window.location.href = 'login.html'; return; }
  try {
    const { liked, like_count } = await API.likePost(postId);
    btn.classList.toggle('liked', liked);
    btn.querySelector('.action-icon').textContent = liked ? '❤️' : '🤍';
    document.getElementById(`like-count-${postId}`).textContent = formatNumber(like_count);
  } catch (e) { toast(e.error || 'Failed', 'error'); }
}

async function toggleComments(postId) {
  const section = document.getElementById(`comments-${postId}`);
  const isOpen  = section.style.display !== 'none';
  section.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) await loadComments(postId);
}

async function loadComments(postId) {
  const list = document.getElementById(`comments-list-${postId}`);
  try {
    const comments = await API.getComments(postId);
    if (!comments.length) {
      list.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:1rem;font-size:.85rem">No comments yet</p>';
      return;
    }
    list.innerHTML = comments.map(c => buildCommentHTML(c, postId)).join('');
  } catch {
    list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:1rem">Failed to load</p>';
  }
}

function buildCommentHTML(c, postId) {
  const isOwn = State.user?.id === c.user_id;
  return `
    <div class="comment-item" id="comment-${c.id}">
      ${avatarEl(c.avatar_url, c.username, 'avatar-sm')}
      <div class="comment-body">
        <div class="comment-header">
          <span class="comment-author" onclick="window.location.href='profile.html?u=${c.username}'">${c.display_name}</span>
          ${verifiedBadge(c.is_verified)}
          <span class="comment-time">${timeAgo(c.created_at)}</span>
        </div>
        <div class="comment-text">${linkifyContent(c.content)}</div>
        <div class="comment-actions">
          <button class="comment-like-btn ${c.viewer_liked ? 'liked' : ''}" onclick="handleCommentLike(${c.id},this)">
            ${c.viewer_liked ? '❤️' : '🤍'} <span>${c.like_count || 0}</span>
          </button>
          ${isOwn ? `<button class="comment-like-btn" onclick="handleDeleteComment(${postId},${c.id})" style="color:var(--red)">🗑</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

function handleCommentKey(e, postId) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(postId); }
}

async function submitComment(postId) {
  if (!State.isLoggedIn) { window.location.href = 'login.html'; return; }
  const input   = document.getElementById(`comment-input-${postId}`);
  const content = input.value.trim();
  if (!content) return;
  try {
    const comment = await API.addComment(postId, { content });
    input.value = '';
    const list  = document.getElementById(`comments-list-${postId}`);
    const empty = list.querySelector('p');
    if (empty) empty.remove();
    list.insertAdjacentHTML('beforeend', buildCommentHTML(comment, postId));
    const cnt = document.getElementById(`comment-count-${postId}`);
    cnt.textContent = parseInt(cnt.textContent || 0) + 1;
  } catch (e) { toast(e.error || 'Failed to comment', 'error'); }
}

async function handleCommentLike(cid, btn) {
  if (!State.isLoggedIn) { window.location.href = 'login.html'; return; }
  try {
    const { liked, like_count } = await API.likeComment(cid);
    btn.classList.toggle('liked', liked);
    btn.innerHTML = `${liked ? '❤️' : '🤍'} <span>${like_count}</span>`;
  } catch {}
}

async function handleDeleteComment(postId, cid) {
  if (!confirm('Delete this comment?')) return;
  try {
    await API.deleteComment(postId, cid);
    document.getElementById(`comment-${cid}`)?.remove();
    const cnt = document.getElementById(`comment-count-${postId}`);
    cnt.textContent = Math.max(0, parseInt(cnt.textContent || 1) - 1);
    toast('Comment deleted', 'success');
  } catch (e) { toast(e.error || 'Failed', 'error'); }
}

async function deletePost(id) {
  if (!confirm('Delete this post?')) return;
  try {
    await API.deletePost(id);
    document.getElementById(`post-${id}`)?.remove();
    toast('Post deleted', 'success');
  } catch (e) { toast(e.error || 'Failed', 'error'); }
}

async function editPost(id) {
  const postEl = document.getElementById(`post-${id}`);
  const contentEl = postEl?.querySelector('.post-content');
  if (!contentEl) return;
  const current = contentEl.textContent.trim();
  openModal(`
    <div class="modal-header">
      <span class="modal-title">Edit Post</span>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <textarea class="form-input" id="edit-post-text" style="width:100%;min-height:120px">${current}</textarea>
    <div style="display:flex;justify-content:flex-end;gap:.75rem;margin-top:1rem">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitEditPost(${id})">Save</button>
    </div>
  `);
}

async function submitEditPost(id) {
  const content = document.getElementById('edit-post-text')?.value.trim();
  if (!content) return;
  try {
    const updated = await API.updatePost(id, { content });
    document.getElementById(`post-${id}`)?.querySelector('.post-content')
      ?.insertAdjacentHTML('afterbegin', ''); // refresh safely
    document.getElementById(`post-${id}`)
      .querySelector('.post-content').innerHTML = linkifyContent(updated.content);
    closeModal();
    toast('Post updated!', 'success');
  } catch (e) { toast(e.error || 'Failed', 'error'); }
}

function sharePost(id) {
  const url = `${window.location.origin}/pages/post.html?id=${id}`;
  navigator.clipboard?.writeText(url).then(() => toast('Link copied!', 'success'))
    .catch(() => toast(`Link: ${url}`, 'info'));
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', renderNavbar);
