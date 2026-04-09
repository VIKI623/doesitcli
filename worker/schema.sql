CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL,
    user_hash TEXT NOT NULL,
    content TEXT NOT NULL,
    rating INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_slug_time ON comments(slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_time ON comments(user_hash, created_at);
