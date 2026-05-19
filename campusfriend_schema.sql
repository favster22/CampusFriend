-- ─────────────────────────────────────────────────────────────────────────────
-- CampusFriend PostgreSQL Schema (v2)
-- Updated to match actual backend models and controllers
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name             VARCHAR(100) NOT NULL,
  username              VARCHAR(50)  NOT NULL UNIQUE,
  email                 VARCHAR(255) NOT NULL UNIQUE,
  password              TEXT         NOT NULL,
  student_id            VARCHAR(50),
  department            VARCHAR(100),
  bio                   TEXT,
  avatar                TEXT,
  header                TEXT,
  skills                TEXT[]       DEFAULT '{}',
  is_online             BOOLEAN      DEFAULT FALSE,
  last_seen             TIMESTAMPTZ  DEFAULT NOW(),
  verified              BOOLEAN      DEFAULT FALSE,

  -- Follow counts (denormalised for fast reads, kept in sync via triggers)
  followers_count       INT          DEFAULT 0,
  following_count       INT          DEFAULT 0,

  -- Privacy settings (from updateProfile controller)
  private_account       BOOLEAN      DEFAULT FALSE,
  hide_following        BOOLEAN      DEFAULT FALSE,
  show_online_status    BOOLEAN      DEFAULT TRUE,
  hide_likes            BOOLEAN      DEFAULT FALSE,

  -- Social links
  github_url            TEXT,
  linkedin_url          TEXT,
  twitter_url           TEXT,

  -- Notification preferences (mirrors notificationPrefs object)
  notif_new_follower    BOOLEAN      DEFAULT TRUE,
  notif_new_message     BOOLEAN      DEFAULT TRUE,
  notif_post_like       BOOLEAN      DEFAULT TRUE,
  notif_post_comment    BOOLEAN      DEFAULT TRUE,
  notif_community       BOOLEAN      DEFAULT TRUE,

  created_at            TIMESTAMPTZ  DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── FOLLOWS ─────────────────────────────────────────────────────────────────
CREATE TABLE follows (
  follower_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Auto-sync followers_count / following_count when follows row is inserted/deleted
CREATE OR REPLACE FUNCTION sync_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
    UPDATE users SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_follows_counts
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION sync_follow_counts();

-- ─── NOTIFY USERS (bell icon on a profile) ───────────────────────────────────
CREATE TABLE notify_users (
  watcher_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (watcher_id, target_id)
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
  category      VARCHAR(50)  DEFAULT 'general',
  is_private    BOOLEAN      DEFAULT FALSE,
  tags          TEXT[]       DEFAULT '{}',
  creator_id    UUID         REFERENCES users(id) ON DELETE SET NULL,
  member_count  INT          DEFAULT 0,
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

-- Auto-sync member_count
CREATE OR REPLACE FUNCTION sync_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_member_count
  AFTER INSERT OR DELETE ON community_members
  FOR EACH ROW EXECUTE FUNCTION sync_member_count();

-- ─── POSTS (Campus Feed) ─────────────────────────────────────────────────────
CREATE TABLE posts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_id      UUID REFERENCES communities(id) ON DELETE SET NULL,
  original_post_id  UUID REFERENCES posts(id) ON DELETE SET NULL, -- MakeMeFamous repost
  content           TEXT NOT NULL,
  post_type         VARCHAR(20) DEFAULT 'general'
                    CHECK (post_type IN ('general', 'announcement', 'event', 'resource', 'question')),
  tags              TEXT[]      DEFAULT '{}',
  is_pinned         BOOLEAN     DEFAULT FALSE,
  is_deleted        BOOLEAN     DEFAULT FALSE,
  share_count       INT         DEFAULT 0,
  -- Event details (only populated when post_type = 'event')
  event_date        TIMESTAMPTZ,
  event_location    VARCHAR(255),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
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

-- ─── STORIES ─────────────────────────────────────────────────────────────────
-- Matches storyController.js (text/media, 24h expiry, viewer tracking)
CREATE TABLE stories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text        TEXT         DEFAULT '',
  bg_color    VARCHAR(20)  DEFAULT '#0f6485',
  media_url   TEXT         DEFAULT '',
  media_type  VARCHAR(10)  DEFAULT 'text' CHECK (media_type IN ('text', 'image', 'video')),
  expires_at  TIMESTAMPTZ  DEFAULT NOW() + INTERVAL '24 hours',
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE story_views (
  story_id    UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (story_id, user_id)
);

-- ─── MESSAGES ────────────────────────────────────────────────────────────────
-- Matches messageController.js — direct (sender+recipient) or community messages
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id    UUID REFERENCES users(id) ON DELETE CASCADE,   -- NULL for community msgs
  community_id    UUID REFERENCES communities(id) ON DELETE CASCADE, -- NULL for direct msgs
  content         TEXT NOT NULL,
  message_type    VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  reply_to_id     UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_deleted      BOOLEAN     DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT must_have_target CHECK (
    (recipient_id IS NOT NULL AND community_id IS NULL) OR
    (recipient_id IS NULL     AND community_id IS NOT NULL)
  )
);

-- ─── MESSAGE READ RECEIPTS ────────────────────────────────────────────────────
CREATE TABLE message_reads (
  message_id  UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
-- Matches notificationController.js
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  type          VARCHAR(30) NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'message', 'community', 'mention', 'system')),
  message       TEXT        NOT NULL,
  is_read       BOOLEAN     DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PASSWORD RESET TOKENS ───────────────────────────────────────────────────
-- Matches authController.js forgotPassword / resetPassword
CREATE TABLE password_reset_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_users_username        ON users(username);
CREATE INDEX idx_users_email           ON users(email);
CREATE INDEX idx_users_verified        ON users(verified);

CREATE INDEX idx_follows_follower      ON follows(follower_id);
CREATE INDEX idx_follows_following     ON follows(following_id);

CREATE INDEX idx_posts_author          ON posts(author_id);
CREATE INDEX idx_posts_community       ON posts(community_id);
CREATE INDEX idx_posts_type            ON posts(post_type);
CREATE INDEX idx_posts_created         ON posts(created_at DESC);
CREATE INDEX idx_posts_not_deleted     ON posts(is_deleted) WHERE is_deleted = FALSE;

CREATE INDEX idx_comments_post         ON post_comments(post_id);
CREATE INDEX idx_comments_author       ON post_comments(author_id);

CREATE INDEX idx_stories_author        ON stories(author_id);
CREATE INDEX idx_stories_expires       ON stories(expires_at);

CREATE INDEX idx_messages_sender       ON messages(sender_id);
CREATE INDEX idx_messages_recipient    ON messages(recipient_id);
CREATE INDEX idx_messages_community    ON messages(community_id);
CREATE INDEX idx_messages_created      ON messages(created_at DESC);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_unread    ON notifications(recipient_id, is_read) WHERE is_read = FALSE;

CREATE INDEX idx_reset_tokens_expires  ON password_reset_tokens(expires_at);

-- ─── UPDATED_AT TRIGGERS ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_communities_updated_at
  BEFORE UPDATE ON communities FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── VIEWS ───────────────────────────────────────────────────────────────────

-- Full user stats in one query
CREATE VIEW user_stats AS
SELECT
  u.id,
  u.username,
  u.full_name,
  u.followers_count,
  u.following_count,
  COUNT(DISTINCT p.id) FILTER (WHERE p.is_deleted = FALSE) AS posts_count,
  COUNT(DISTINCT s.id) FILTER (WHERE s.expires_at > NOW())  AS active_stories_count
FROM users u
LEFT JOIN posts   p ON p.author_id = u.id
LEFT JOIN stories s ON s.author_id = u.id
GROUP BY u.id, u.username, u.full_name, u.followers_count, u.following_count;

-- Post stats — respects hide_likes via application layer
CREATE VIEW post_stats AS
SELECT
  p.id,
  p.content,
  p.post_type,
  p.is_pinned,
  p.created_at,
  p.author_id,
  p.community_id,
  p.share_count,
  COUNT(DISTINCT pl.user_id) AS likes_count,
  COUNT(DISTINCT pc.id)      AS comments_count
FROM posts p
LEFT JOIN post_likes    pl ON pl.post_id = p.id
LEFT JOIN post_comments pc ON pc.post_id = p.id
WHERE p.is_deleted = FALSE
GROUP BY p.id;

-- Unread notifications per user
CREATE VIEW unread_notification_counts AS
SELECT recipient_id AS user_id, COUNT(*) AS unread_count
FROM notifications
WHERE is_read = FALSE
GROUP BY recipient_id;

-- Recent direct chat list (mirrors getRecentChats aggregation)
CREATE VIEW recent_direct_chats AS
SELECT DISTINCT ON (LEAST(m.sender_id::TEXT, m.recipient_id::TEXT),
                    GREATEST(m.sender_id::TEXT, m.recipient_id::TEXT))
  m.id            AS last_message_id,
  m.sender_id,
  m.recipient_id,
  m.content       AS last_message,
  m.created_at    AS last_message_at
FROM messages m
WHERE m.recipient_id IS NOT NULL
  AND m.is_deleted  = FALSE
ORDER BY LEAST(m.sender_id::TEXT, m.recipient_id::TEXT),
         GREATEST(m.sender_id::TEXT, m.recipient_id::TEXT),
         m.created_at DESC;