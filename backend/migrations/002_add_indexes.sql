-- ============================================================
-- 002: Add performance indexes
-- Usage: mysql -u root -p zal_db < migrations/002_add_indexes.sql
-- ============================================================

-- visits: frequently queried by client, gym, entered_at
CREATE INDEX IF NOT EXISTS idx_visit_client ON visits(client_id);
CREATE INDEX IF NOT EXISTS idx_visit_gym ON visits(gym_id);
CREATE INDEX IF NOT EXISTS idx_visit_entered ON visits(entered_at);
CREATE INDEX IF NOT EXISTS idx_visit_exited ON visits(exited_at);

-- subscriptions: queried by client, status, category
CREATE INDEX IF NOT EXISTS idx_sub_client ON subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_sub_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_sub_gym ON subscriptions(gym_id);

-- payments: queried by client, date
CREATE INDEX IF NOT EXISTS idx_payment_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_date ON payments(date);
CREATE INDEX IF NOT EXISTS idx_payment_gym ON payments(gym_id);

-- clients: queried by gym, code
CREATE INDEX IF NOT EXISTS idx_client_gym ON clients(gym_id);

-- Also update subscriptions table to support new statuses and fields
-- (purchased status, category, duration_days, purchased_at, activated_at)
-- These were already added via Sequelize sync, but ensure SQL schema matches:

ALTER TABLE subscriptions
  MODIFY COLUMN status ENUM('purchased','active','expired','frozen') NOT NULL DEFAULT 'purchased',
  MODIFY COLUMN start_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'gym' AFTER type,
  ADD COLUMN IF NOT EXISTS duration_days INT DEFAULT NULL AFTER price,
  ADD COLUMN IF NOT EXISTS purchased_at DATETIME DEFAULT NULL AFTER frozen_to,
  ADD COLUMN IF NOT EXISTS activated_at DATETIME DEFAULT NULL AFTER purchased_at;

-- visits: add subscription_id FK
ALTER TABLE visits
  ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(36) DEFAULT NULL AFTER client_id;
