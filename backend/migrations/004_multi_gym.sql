-- ============================================================
-- ZAL CRM — Multi-gym subscription support
-- Usage: mysql -u root -p zal < migrations/004_multi_gym.sql
-- ============================================================

-- Allowed gyms for a subscription (JSON array of gym IDs, e.g. ["gym1","gym2"])
-- NULL means subscription works only in its own gym (backward compatible)
ALTER TABLE subscriptions
  ADD COLUMN allowed_gyms JSON NULL DEFAULT NULL;

-- Flag on preset: if true, new subscription auto-receives all gym IDs in allowed_gyms
ALTER TABLE subscription_presets
  ADD COLUMN multi_gym TINYINT(1) NOT NULL DEFAULT 0;
