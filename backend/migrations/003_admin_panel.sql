-- Admin panel tables

CREATE TABLE IF NOT EXISTS admins (
id CHAR(36) PRIMARY KEY,
login VARCHAR(100) NOT NULL UNIQUE,
password_hash VARCHAR(255) NOT NULL,
name VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS subscription_presets (
id CHAR(36) PRIMARY KEY,
gym_id VARCHAR(50) NOT NULL,
label VARCHAR(100) NOT NULL,
type ENUM('unlimited','visits') NOT NULL,
category ENUM('gym','group') NOT NULL DEFAULT 'gym',
duration_days INT NOT NULL,
price DECIMAL(10,2) NOT NULL,
total_visits INT DEFAULT NULL,
is_active TINYINT(1) NOT NULL DEFAULT 1,
FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE,
INDEX idx_subscription_presets_gym (gym_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_logs (
id CHAR(36) PRIMARY KEY,
gym_id VARCHAR(50) NOT NULL,
worker_id CHAR(36) DEFAULT NULL,
worker_name VARCHAR(100) DEFAULT NULL,
action VARCHAR(100) NOT NULL,
entity VARCHAR(50) NOT NULL,
entity_id VARCHAR(50) DEFAULT NULL,
details TEXT DEFAULT NULL,
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE,
INDEX idx_audit_gym_created (gym_id, created_at),
INDEX idx_audit_entity (entity, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default admin (login: admin, password: admin123)

INSERT IGNORE INTO admins (id, login, password_hash, name) VALUES (
'cccccccc-0002-0002-0002-000000000022',
'admin',
'$2a$10$6WVojMz08AHrkcjGlkD1EutDQVLGZkeCse/QP2g5GxT8m4BW25zlq',
'Адміністратор'
);
