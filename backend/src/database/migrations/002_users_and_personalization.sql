CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  password_salt VARCHAR(64) NOT NULL,
  password_algorithm VARCHAR(40) NOT NULL DEFAULT 'scrypt',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_settings (
  user_id BIGINT UNSIGNED NOT NULL,
  primary_server VARCHAR(20) NOT NULL DEFAULT 'europe',
  primary_city VARCHAR(80) NOT NULL DEFAULT 'Caerleon',
  language VARCHAR(12) NOT NULL DEFAULT 'pt-BR',
  currency_server VARCHAR(20) NOT NULL DEFAULT 'europe',
  market_tax_rate DECIMAL(6,4) NOT NULL DEFAULT 0.0650,
  focus_return_rate DECIMAL(6,4) NOT NULL DEFAULT 0.4790,
  player_type VARCHAR(40) NOT NULL DEFAULT 'Trader',
  premium_goal_silver BIGINT UNSIGNED NOT NULL DEFAULT 0,
  daily_profit_goal BIGINT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_settings_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_favorites (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  item_id VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_favorites_user_item (user_id, item_id),
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_favorites_item FOREIGN KEY (item_id) REFERENCES items (item_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS saved_opportunities (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  opportunity_type VARCHAR(40) NOT NULL,
  item_id VARCHAR(120) NULL,
  title VARCHAR(180) NOT NULL,
  payload JSON NULL,
  target_net_profit BIGINT NOT NULL DEFAULT 0,
  target_margin_percent DECIMAL(8,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_saved_opportunities_user_created (user_id, created_at),
  CONSTRAINT fk_saved_opportunities_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_saved_opportunities_item FOREIGN KEY (item_id) REFERENCES items (item_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS analysis_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  analysis_type VARCHAR(40) NOT NULL,
  summary VARCHAR(220) NOT NULL,
  payload JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_analysis_history_user_created (user_id, created_at),
  CONSTRAINT fk_analysis_history_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(128) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_password_reset_token (token_hash),
  CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE user_watchlist
  ADD COLUMN user_id BIGINT UNSIGNED NULL AFTER id,
  DROP FOREIGN KEY fk_watchlist_item,
  DROP INDEX uq_watchlist_item,
  ADD KEY idx_watchlist_item (item_id),
  ADD KEY idx_watchlist_user_created (user_id, created_at),
  ADD UNIQUE KEY uq_watchlist_user_item (user_id, item_id),
  ADD CONSTRAINT fk_watchlist_item FOREIGN KEY (item_id) REFERENCES items (item_id)
    ON UPDATE CASCADE ON DELETE CASCADE;
