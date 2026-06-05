# Pulse — Social Media Platform

A full-stack social media app with Express.js + MySQL backend and a modern glossy light-theme frontend.

---

## Folder Structure

```
pulse/
├── database.sql                  ← Run this first to set up MySQL
├── backend/
│   ├── .env                      ← Set your DB credentials here
│   ├── package.json
│   ├── server.js                 ← Entry point
│   ├── config/
│   │   └── db.js                 ← MySQL connection pool
│   ├── middleware/
│   │   └── auth.js               ← JWT protect / optionalAuth
│   ├── controllers/
│   │   ├── authController.js     ← register, login, me, updateProfile
│   │   ├── postController.js     ← feed, explore, CRUD, likes, comments
│   │   └── userController.js     ← profiles, follow, suggestions, search
│   └── routes/
│       └── index.js              ← All routes wired together
└── frontend/
    ├── index.html                ← Landing page
    ├── css/
    │   └── style.css             ← Full glossy light theme
    ├── js/
    │   ├── api.js                ← API client, State, helpers
    │   └── navbar.js             ← Shared navbar + post builder
    └── pages/
        ├── login.html            ← Sign in
        ├── register.html         ← Create account
        ├── feed.html             ← Home feed + compose
        ├── explore.html          ← Discover posts + search people
        ├── profile.html          ← User profile + posts/followers/following
        ├── post.html             ← Single post thread view
        └── notifications.html   ← All notifications
```

---

## Setup

### 1. Database

```bash
mysql -u root -p < database.sql
```

This creates the `pulse_db` database, all tables, views, and seeds 4 demo users + posts.

**Demo accounts** (password: `Password123`):
| Username | Role     |
|----------|----------|
| alexj    | Verified |
| sarahm   | User     |
| techbro  | Verified |
| Luna     | User     |

---

### 2. Backend

```bash
cd backend
npm install
```

Edit `.env` with your MySQL credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=pulse_db
JWT_SECRET=any_long_random_string
```

Start the server:
```bash
npm run dev      # with nodemon (auto-restart)
# or
npm start        # plain node
```

API runs at **http://localhost:5000**

---

### 3. Frontend

No build step needed — pure HTML/CSS/JS.

Open with any static server:

```bash
# Python
python3 -m http.server 5500 --directory frontend

# Node (npx)
npx serve frontend -p 5500

# VS Code: just open with Live Server extension
```

Then visit **http://localhost:5500**

---

## API Reference

### Auth
| Method | Endpoint              | Auth     | Description        |
|--------|-----------------------|----------|--------------------|
| POST   | /api/auth/register    | –        | Create account     |
| POST   | /api/auth/login       | –        | Sign in            |
| GET    | /api/auth/me          | Required | Current user + stats|
| PUT    | /api/auth/profile     | Required | Update profile     |

### Posts
| Method | Endpoint                       | Auth     |
|--------|--------------------------------|----------|
| GET    | /api/posts/feed                | Required |
| GET    | /api/posts/explore             | Optional |
| POST   | /api/posts                     | Required |
| PUT    | /api/posts/:id                 | Required |
| DELETE | /api/posts/:id                 | Required |
| POST   | /api/posts/:id/like            | Required |
| GET    | /api/posts/:id/comments        | Optional |
| POST   | /api/posts/:id/comments        | Required |
| DELETE | /api/posts/:id/comments/:cid   | Required |
| POST   | /api/posts/comments/:cid/like  | Required |
| GET    | /api/posts/notifications       | Required |

### Users
| Method | Endpoint                       | Auth     |
|--------|--------------------------------|----------|
| GET    | /api/users/:username           | Optional |
| GET    | /api/users/:username/posts     | Optional |
| POST   | /api/users/:username/follow    | Required |
| GET    | /api/users/:username/followers | Optional |
| GET    | /api/users/:username/following | Optional |
| GET    | /api/users/suggestions         | Required |
| GET    | /api/users/search?q=           | Optional |

---

## Features

- ✅ User registration & login (JWT auth)
- ✅ Profile pages with avatar, bio, cover, stats
- ✅ Follow / unfollow with toggle
- ✅ Followers & following lists
- ✅ Post feed (following only + explore/trending)
- ✅ Create, edit, delete posts
- ✅ Image URL support in posts
- ✅ Hashtag extraction and linking
- ✅ Like / unlike posts and comments
- ✅ Threaded comments with replies
- ✅ Notifications (likes, comments, follows)
- ✅ User search
- ✅ Who-to-follow suggestions
- ✅ Responsive — mobile bottom nav on small screens
- ✅ Skeleton loading states
- ✅ Toast notifications

---

## Tech Stack

| Layer    | Tech                          |
|----------|-------------------------------|
| Backend  | Node.js · Express · mysql2    |
| Auth     | bcryptjs · jsonwebtoken       |
| Database | MySQL 8+ with views           |
| Frontend | Vanilla HTML/CSS/JS           |
| Fonts    | Inter · Playfair Display      |
| Avatars  | DiceBear API (fallback)       |
