-- =============================================
--  PULSE  –  Social Media (Semester Project)
--  Run: mysql -u root -p < database.sql
-- =============================================

CREATE DATABASE IF NOT EXISTS pulse_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE pulse_db;

CREATE TABLE IF NOT EXISTS users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  username     VARCHAR(30)  NOT NULL UNIQUE,
  email        VARCHAR(120) NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,
  full_name    VARCHAR(80)  NOT NULL DEFAULT '',
  bio          VARCHAR(200) DEFAULT '',
  avatar_url   VARCHAR(400) DEFAULT '',
  cover_url    VARCHAR(400) DEFAULT '',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT  NOT NULL,
  content    TEXT NOT NULL,
  image_url  VARCHAR(400) DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  post_id    INT  NOT NULL,
  user_id    INT  NOT NULL,
  content    VARCHAR(500) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id)  ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)  ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS likes (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  UNIQUE KEY unique_like (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id)  ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)  ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS followers (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  follower_id  INT NOT NULL,
  following_id INT NOT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_follow (follower_id, following_id),
  FOREIGN KEY (follower_id)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
--  SEED DATA  (plain text passwords)
-- =============================================
INSERT IGNORE INTO users (username, email, password, full_name, bio, avatar_url) VALUES
('johndoe',  'john@pulse.com',  'password123', 'John Doe',   'Software student 💻',       'https://api.dicebear.com/7.x/avataaars/svg?seed=john'),
('sarahk',   'sarah@pulse.com', 'password123', 'Sarah Khan', 'Photography lover 📷',      'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah'),
('mikec',    'mike@pulse.com',  'password123', 'Mike Chen',  'Web dev & coffee addict ☕', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike');

INSERT IGNORE INTO posts (user_id, content, image_url) VALUES
(1, 'Just finished my first React project! Really loving frontend development so far 🚀', 'https://images.unsplash.com/photo-1593720219276-0b1eacd0aef4?w=600&q=80'),
(2, 'Golden hour shots from my walk today. Nature never disappoints 🌅', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&q=80'),
(3, 'Hot take: CSS Grid is better than Flexbox for page layouts. Change my mind. #webdev', ''),
(1, 'Study tip: take breaks every 45 minutes. Your brain will thank you. #studyhacks', ''),
(2, 'Made homemade pasta for the first time! Took 2 hours but totally worth it 🍝', 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=600&q=80');

INSERT IGNORE INTO comments (post_id, user_id, content) VALUES
(1, 2, 'That is awesome! React is so fun once it clicks.'),
(1, 3, 'Congrats! What did you build?'),
(2, 1, 'Stunning photo Sarah! 😍'),
(3, 1, 'Both have their place honestly!'),
(3, 2, 'Grid gang all the way 🙌');

INSERT IGNORE INTO likes (post_id, user_id) VALUES
(1,2),(1,3),(2,1),(2,3),(3,1),(3,2),(4,2),(4,3),(5,1),(5,3);

INSERT IGNORE INTO followers (follower_id, following_id) VALUES
(1,2),(1,3),(2,1),(2,3),(3,1);
