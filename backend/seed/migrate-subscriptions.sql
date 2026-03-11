-- Migration: subscription system v2
-- Run this on an existing DB (without re-seeding)

-- 1. Subscriptions: add new columns
ALTER TABLE subscriptions
  ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'gym' AFTER type,
  ADD COLUMN duration_days INT NULL AFTER price,
  ADD COLUMN purchased_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER frozen_to,
  ADD COLUMN activated_at DATETIME NULL AFTER purchased_at;

-- 2. Subscriptions: update status ENUM to include 'purchased'
ALTER TABLE subscriptions
  MODIFY COLUMN status ENUM('purchased', 'active', 'expired', 'frozen') NOT NULL DEFAULT 'purchased';

-- 3. Subscriptions: update type ENUM (remove 'single')
ALTER TABLE subscriptions
  MODIFY COLUMN type ENUM('unlimited', 'visits') NOT NULL;

-- 4. Subscriptions: allow NULL start_date (purchased subs have no start yet)
ALTER TABLE subscriptions
  MODIFY COLUMN start_date DATE NULL;

-- 5. Subscriptions: fill duration_days for existing active subs
UPDATE subscriptions SET duration_days = DATEDIFF(end_date, start_date) WHERE end_date IS NOT NULL AND start_date IS NOT NULL;
UPDATE subscriptions SET duration_days = 30 WHERE duration_days IS NULL;

-- 6. Subscriptions: fill purchased_at and activated_at for existing
UPDATE subscriptions SET purchased_at = created_at;
UPDATE subscriptions SET activated_at = created_at WHERE status IN ('active', 'expired', 'frozen');

-- 7. Visits: add subscription_id column
ALTER TABLE visits
  ADD COLUMN subscription_id CHAR(36) NULL AFTER client_id;
