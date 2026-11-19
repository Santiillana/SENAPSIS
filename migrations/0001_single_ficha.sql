-- Fase 7: repositorio de contenido de una sola ficha, según la exclusión vigente
-- de la fase 6. No almacenar estado personal del aprendiz aquí.
CREATE TABLE IF NOT EXISTS published_state (
  singleton TEXT PRIMARY KEY NOT NULL CHECK (singleton = 'current'),
  version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0),
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  published_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS draft_state (
  singleton TEXT PRIMARY KEY NOT NULL CHECK (singleton = 'current'),
  base_version INTEGER NOT NULL CHECK (base_version >= 0),
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS publication_history (
  version INTEGER PRIMARY KEY CHECK (version > 0),
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  published_at TEXT NOT NULL,
  published_by TEXT NOT NULL,
  undone_at TEXT,
  undone_by TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('draft_saved', 'published', 'publication_undone', 'backup_imported')),
  version INTEGER,
  created_at TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS audit_log_created_at ON audit_log(created_at DESC);
