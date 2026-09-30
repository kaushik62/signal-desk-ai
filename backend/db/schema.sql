CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  company           TEXT,
  source            TEXT NOT NULL DEFAULT 'Other'
    CHECK (source IN ('Website','LinkedIn','Facebook Ads','Referral','Cold Email','Other')),
  status            TEXT NOT NULL DEFAULT 'New'
    CHECK (status IN ('New','Contacted','Interested','Converted','Lost')),
  notes             TEXT,
  score             INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  last_contacted_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_user_status ON leads (user_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_user_created ON leads (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS follow_ups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id     UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  subject     TEXT NOT NULL,
  email_body  TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sending','processing','sent','failed','cancelled')),
  sent_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_follow_ups_user_status ON follow_ups (user_id, status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead ON follow_ups (lead_id);
