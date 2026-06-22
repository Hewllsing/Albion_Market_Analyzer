CREATE TABLE IF NOT EXISTS items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_id VARCHAR(120) NOT NULL,
  name VARCHAR(180) NOT NULL,
  category VARCHAR(80) NOT NULL,
  tier TINYINT UNSIGNED NOT NULL,
  enchantment TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_items_item_id (item_id),
  KEY idx_items_category_tier (category, tier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS market_prices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_id VARCHAR(120) NOT NULL,
  city VARCHAR(80) NOT NULL,
  quality TINYINT UNSIGNED NOT NULL,
  sell_price_min BIGINT UNSIGNED NOT NULL DEFAULT 0,
  sell_price_min_date DATETIME NULL,
  sell_price_max BIGINT UNSIGNED NOT NULL DEFAULT 0,
  buy_price_max BIGINT UNSIGNED NOT NULL DEFAULT 0,
  buy_price_max_date DATETIME NULL,
  server VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_market_item_city_created (item_id, city, created_at),
  KEY idx_market_server_created (server, created_at),
  CONSTRAINT fk_market_item FOREIGN KEY (item_id) REFERENCES items (item_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crafting_recipes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_id VARCHAR(120) NOT NULL,
  material_item_id VARCHAR(120) NOT NULL,
  quantity DECIMAL(12,3) UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_recipe_material (item_id, material_item_id),
  CONSTRAINT fk_recipe_item FOREIGN KEY (item_id) REFERENCES items (item_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_recipe_material FOREIGN KEY (material_item_id) REFERENCES items (item_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_watchlist (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_id VARCHAR(120) NOT NULL,
  target_profit_percent DECIMAL(8,2) NOT NULL DEFAULT 15,
  target_net_profit BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_watchlist_item (item_id),
  CONSTRAINT fk_watchlist_item FOREIGN KEY (item_id) REFERENCES items (item_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
