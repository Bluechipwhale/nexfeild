-- Additive commercial pricing foundation. Amounts are stored in minor currency units.
CREATE TABLE IF NOT EXISTS saas_modules (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS saas_prices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  module_id BIGINT UNSIGNED NULL,
  price_type ENUM('module','shared_license','module_license') NOT NULL,
  billing_cycle ENUM('monthly','quarterly','half_yearly','annually') NOT NULL,
  currency CHAR(3) NOT NULL,
  amount_minor BIGINT UNSIGNED NOT NULL,
  effective_from DATETIME NOT NULL,
  effective_until DATETIME NULL,
  INDEX ix_saas_price_lookup (price_type, module_id, billing_cycle, currency, effective_from),
  CONSTRAINT fk_saas_price_module FOREIGN KEY (module_id) REFERENCES saas_modules(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
