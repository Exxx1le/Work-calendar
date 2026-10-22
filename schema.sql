CREATE TABLE IF NOT EXISTS calendar_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO calendar_state (id, payload) VALUES (1, '{"users":{},"currentUserName":""}');
