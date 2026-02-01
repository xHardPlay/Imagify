-- Analyses table for storing analysis history
-- Images are stored locally in IndexedDB, only results and metadata in DB

CREATE TABLE analyses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workflow_id TEXT,
    workflow_name TEXT NOT NULL,
    title TEXT NOT NULL,
    result_data TEXT NOT NULL,  -- JSON string with analysis results
    thumbnail_base64 TEXT,      -- Small thumbnail for preview (optional)
    local_image_id TEXT,        -- ID to link with IndexedDB storage
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE SET NULL
);

-- Index for fast user lookups
CREATE INDEX idx_analyses_user ON analyses(user_id);
CREATE INDEX idx_analyses_created ON analyses(created_at DESC);
CREATE INDEX idx_analyses_workflow ON analyses(workflow_id);
