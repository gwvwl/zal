-- ============================================================
-- ZAL CRM — Initial Schema + Seed
-- Usage: mysql -u root -p < migrations/001_init.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS zal_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE zal_db;

-- --------------------------------------------------------
-- gyms
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS gyms (
  id            VARCHAR(50)   NOT NULL PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  login         VARCHAR(100)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- workers
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS workers (
  id            VARCHAR(36)   NOT NULL PRIMARY KEY,
  gym_id        VARCHAR(50)   NOT NULL,
  name          VARCHAR(100)  NOT NULL,
  role          ENUM('admin','reception','trainer') NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  avatar        VARCHAR(255)  DEFAULT NULL,
  CONSTRAINT fk_worker_gym FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- clients
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id          VARCHAR(36)  NOT NULL PRIMARY KEY,
  gym_id      VARCHAR(50)  NOT NULL,
  code        VARCHAR(100) DEFAULT NULL,
  last_name   VARCHAR(100) NOT NULL,
  first_name  VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100) DEFAULT NULL,
  phone       VARCHAR(30)  DEFAULT NULL,
  email       VARCHAR(150) DEFAULT NULL,
  birth_date  DATE         DEFAULT NULL,
  gender      ENUM('male','female') DEFAULT NULL,
  goal        VARCHAR(255) DEFAULT NULL,
  experience  VARCHAR(255) DEFAULT NULL,
  source      VARCHAR(100) DEFAULT NULL,
  created_at  DATE         NOT NULL,
  photo       VARCHAR(255) DEFAULT NULL,
  UNIQUE KEY uq_client_code_gym (code, gym_id),
  CONSTRAINT fk_client_gym FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- subscriptions
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id           VARCHAR(36)      NOT NULL PRIMARY KEY,
  gym_id       VARCHAR(50)      NOT NULL,
  client_id    VARCHAR(36)      NOT NULL,
  type         ENUM('unlimited','visits','single') NOT NULL,
  label        VARCHAR(150)     NOT NULL,
  start_date   DATE             NOT NULL,
  end_date     DATE             DEFAULT NULL,
  total_visits INT              DEFAULT NULL,
  used_visits  INT              DEFAULT 0,
  status       ENUM('active','expired','frozen') NOT NULL DEFAULT 'active',
  price        DECIMAL(10,2)    NOT NULL,
  frozen_from  DATE             DEFAULT NULL,
  frozen_to    DATE             DEFAULT NULL,
  created_at   DATETIME         NOT NULL,
  CONSTRAINT fk_sub_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_sub_gym    FOREIGN KEY (gym_id)    REFERENCES gyms(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- visits
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS visits (
  id         VARCHAR(36) NOT NULL PRIMARY KEY,
  gym_id     VARCHAR(50) NOT NULL,
  client_id  VARCHAR(36) NOT NULL,
  entered_at DATETIME    NOT NULL,
  exited_at  DATETIME    DEFAULT NULL,
  CONSTRAINT fk_visit_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_visit_gym    FOREIGN KEY (gym_id)    REFERENCES gyms(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- payments
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id          VARCHAR(36)   NOT NULL PRIMARY KEY,
  gym_id      VARCHAR(50)   NOT NULL,
  client_id   VARCHAR(36)   NOT NULL,
  date        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  amount      DECIMAL(10,2) NOT NULL,
  type        ENUM('subscription','single','card_replace') NOT NULL,
  label       VARCHAR(200)  DEFAULT NULL,
  worker_id   VARCHAR(36)   NOT NULL,
  worker_name VARCHAR(100)  NOT NULL,
  method      ENUM('cash','card') NOT NULL,
  CONSTRAINT fk_payment_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_gym    FOREIGN KEY (gym_id)    REFERENCES gyms(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SEED — зали та тестові workers (pin: 1234)
-- bcrypt hash of '1234', cost 10
-- ============================================================

INSERT IGNORE INTO gyms (id, name, login, password_hash) VALUES
  ('gym1', 'Кормарова',  'gym1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
  ('gym2', 'Олімпієць',  'gym2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');

-- Workers gym1 (Кормарова)
INSERT IGNORE INTO workers (id, gym_id, name, role, password_hash, avatar) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'gym1', 'Адмін Адміненко',     'admin',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NULL),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'gym1', 'Ресепшн Приймаленко', 'reception', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NULL),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'gym1', 'Тренер Тренеренко',   'trainer',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NULL);

-- Workers gym2 (Олімпієць)
INSERT IGNORE INTO workers (id, gym_id, name, role, password_hash, avatar) VALUES
  ('b1b2c3d4-0001-0001-0001-000000000001', 'gym2', 'Адмін Олімпієць',     'admin',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NULL),
  ('b1b2c3d4-0002-0002-0002-000000000002', 'gym2', 'Ресепшн Олімпієць',   'reception', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NULL);
