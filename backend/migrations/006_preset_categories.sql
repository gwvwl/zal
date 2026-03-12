-- Розширюємо категорії пресетів: замінюємо вузький ENUM на VARCHAR
-- Це дозволяє зберігати: gym, group, mma, sambo, grappling, stretching, boxing, karate, locker, rental, single
ALTER TABLE subscription_presets
  MODIFY COLUMN category VARCHAR(20) NOT NULL DEFAULT 'gym';
