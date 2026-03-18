-- domovoy-control module tables
-- Runs once against the focus-dashboard SQLite DB when the module is installed.

CREATE TABLE IF NOT EXISTS domovoy_commands (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    command    TEXT    NOT NULL,
    result     TEXT,
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS domovoy_events (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    type       TEXT    NOT NULL,  -- 'wake', 'command', 'response', 'error'
    payload    TEXT,
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS domovoy_control_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
);

INSERT OR IGNORE INTO domovoy_control_settings (key, value) VALUES ('host', '127.0.0.1');
INSERT OR IGNORE INTO domovoy_control_settings (key, value) VALUES ('port', '50055');
