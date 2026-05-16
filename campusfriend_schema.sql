-- ─────────────────────────────────────────────────────────────────────────────
-- CampusFriend PostgreSQL Schema
-- Run this file against your PostgreSQL database to create all tables
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         VARCHAR(100) NOT NULL,
  username          VARCHAR(50)  NOT NULL UNIQUE,
  email             VARCHAR(255) NOT NULL UNIQUE,
  password          TEXT         NOT NULL,
  student_id        VARCHAR(50),
  department        VARCHAR(100),
  bio               TEXT,
  avatar            TEXT,
  header            TEXT,
  skills            TEXT[]       DEFAULT '{}',
  is_online         BOOLEAN      DEFAULT FALSE,
  last_seen         TIMESTAMPTZ  DEFAULT NOW(),
  verified          BOOLEAN      DEFAULT FALSE,
  hide_likes        BOOLEAN      DEFAULT FALSE,
  github_url        TEXT,
  linkedin_url      TEXT,
  twitter_url       TEXT,
  created_at        TIMESTAMPTZ  DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── FOLLOWS ─────────────────────────────────────────────────────────────────
CREATE TABLE follows (
  follower_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- ─── VERIFICATION APPLICATIONS ───────────────────────────────────────────────
CREATE TABLE verification_applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  statement     TEXT,
  submitted_at  TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ,
  reviewer      VARCHAR(100),
  review_notes  TEXT
);

-- ─── COMMUNITIES ─────────────────────────────────────────────────────────────
CREATE TABLE communities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  slug          VARCHAR(100) NOT NULL UNIQUE,
  description   TEXT,
  avatar        TEXT,
  category      VARCHAR(50),
  is_private    BOOLEAN      DEFAULT FALSE,
  created_by    UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── COMMUNITY MEMBERS ───────────────────────────────────────────────────────
CREATE TABLE community_members (
  community_id  UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role          VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

-- ─── POSTS ───────────────────────────────────────────────────────────────────
CREATE TABLE posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_id    UUID REFERENCES communities(id) ON DELETE SET NULL,
  original_post_id UUID REFERENCES posts(id) ON DELETE SET NULL, -- for MakeMeFamous reposts
  content         TEXT NOT NULL,
  post_type       VARCHAR(20) DEFAULT 'general' CHECK (post_type IN ('general', 'announcement', 'event', 'resource', 'question')),
  tags            TEXT[]      DEFAULT '{}',
  -- Event details (only used when post_type = 'event')
  event_date      TIMESTAMPTZ,
  event_location  VARCHAR(255),
  share_count     INT         DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── POST LIKES ──────────────────────────────────────────────────────────────
CREATE TABLE post_likes (
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- ─── POST COMMENTS ───────────────────────────────────────────────────────────
CREATE TABLE post_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MESSAGES ────────────────────────────────────────────────────────────────
CREATE TABLE conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_participants (
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content          TEXT NOT NULL,
  is_read          BOOLEAN     DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PASSWORD RESET TOKENS ───────────────────────────────────────────────────
CREATE TABLE password_reset_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
-- Users
CREATE INDEX idx_users_username  ON users(username);
CREATE INDEX idx_users_email     ON users(email);

-- Follows
CREATE INDEX idx_follows_follower   ON follows(follower_id);
CREATE INDEX idx_follows_following  ON follows(following_id);

-- Posts
CREATE INDEX idx_posts_author     ON posts(author_id);
CREATE INDEX idx_posts_community  ON posts(community_id);
CREATE INDEX idx_posts_type       ON posts(post_type);
CREATE INDEX idx_posts_created    ON posts(created_at DESC);

-- Comments
CREATE INDEX idx_comments_post    ON post_comments(post_id);
CREATE INDEX idx_comments_author  ON post_comments(author_id);

-- Messages
CREATE INDEX idx_messages_conversation  ON messages(conversation_id);
CREATE INDEX idx_messages_sender        ON messages(sender_id);
CREATE INDEX idx_messages_created       ON messages(created_at DESC);

-- Password reset tokens (auto-expire)
CREATE INDEX idx_reset_tokens_expires ON password_reset_tokens(expires_at);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────────────────────
-- Automatically updates updated_at on row changes
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_communities_updated_at
  BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── USEFUL VIEWS ────────────────────────────────────────────────────────────

-- User stats (follower/following counts)
CREATE VIEW user_stats AS
SELECT
  u.id,
  u.username,
  u.full_name,
  COUNT(DISTINCT f1.follower_id)  AS followers_count,
  COUNT(DISTINCT f2.following_id) AS following_count,
  COUNT(DISTINCT p.id)            AS posts_count
FROM users u
LEFT JOIN follows f1 ON f1.following_id = u.id
LEFT JOIN follows f2 ON f2.follower_id  = u.id
LEFT JOIN posts  p  ON p.author_id      = u.id
GROUP BY u.id, u.username, u.full_name;

-- Post stats (like/comment counts)
CREATE VIEW post_stats AS
SELECT
  p.id,
  p.content,
  p.post_type,
  p.created_at,
  p.author_id,
  COUNT(DISTINCT pl.user_id)  AS likes_count,
  COUNT(DISTINCT pc.id)       AS comments_count,
  p.share_count
FROM posts p
LEFT JOIN post_likes    pl ON pl.post_id = p.id
LEFT JOIN post_comments pc ON pc.post_id = p.id
GROUP BY p.id;

-- Unread message counts per user
CREATE VIEW unread_message_counts AS
SELECT
  cp.user_id,
  COUNT(m.id) AS unread_count
FROM conversation_participants cp
JOIN messages m
  ON m.conversation_id = cp.conversation_id
  AND m.sender_id != cp.user_id
  AND m.created_at > cp.last_read_at
GROUP BY cp.user_id;