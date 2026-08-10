CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS hospitals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  facility_type TEXT NOT NULL DEFAULT 'Private',
  hfr_id TEXT,
  phone TEXT,
  license_number TEXT,
  verification_status TEXT NOT NULL DEFAULT 'self_declared',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resource_snapshots (
  id BIGSERIAL PRIMARY KEY,
  hospital_id TEXT NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_beds INTEGER NOT NULL CHECK (total_beds >= 0),
  occupied_beds INTEGER NOT NULL CHECK (occupied_beds BETWEEN 0 AND total_beds),
  icu_available INTEGER NOT NULL DEFAULT 0 CHECK (icu_available >= 0),
  oxygen_beds_available INTEGER NOT NULL DEFAULT 0 CHECK (oxygen_beds_available >= 0),
  blood_inventory JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS resource_snapshots_hospital_time
  ON resource_snapshots(hospital_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id TEXT NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  certificate_type TEXT NOT NULL,
  issuer TEXT,
  registration_number TEXT,
  file_path TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  analysis JSONB NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'manual_review',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id BIGSERIAL PRIMARY KEY,
  actor_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS license_number TEXT;
