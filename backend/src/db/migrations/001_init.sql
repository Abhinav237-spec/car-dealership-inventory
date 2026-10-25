-- Initial schema: users and vehicles.
-- gen_random_uuid() is built into PostgreSQL 13+, no extension needed.

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,           -- stored lower-cased by the API
  password_hash TEXT NOT NULL,                  -- bcrypt hash, never the password
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vehicles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  make       TEXT NOT NULL,
  model      TEXT NOT NULL,
  category   TEXT NOT NULL,
  price      NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  -- The CHECK is a last line of defence: stock can never go below zero,
  -- even if application code has a bug.
  quantity   INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX vehicles_make_model_idx ON vehicles (make, model);
CREATE INDEX vehicles_category_idx ON vehicles (LOWER(category));
