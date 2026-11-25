-- ==============================================================================
-- NEXFIELDFORCE — UNIFIED ENTERPRISE MYSQL PRODUCTION SCHEMA
-- HR + ADMIN + STAFF + SALES FORCE + FIELD FORCE + MONITORING + AI
-- Production MySQL 8.0+ / MariaDB Schema
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Multi-Tenancy & Companies
CREATE TABLE IF NOT EXISTS `companies` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(36) NOT NULL UNIQUE,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `legal_name` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `website` VARCHAR(255) NULL,
  `logo_url` TEXT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'NGN',
  `timezone` VARCHAR(50) NOT NULL DEFAULT 'Africa/Lagos',
  `subscription_plan` VARCHAR(50) NOT NULL DEFAULT 'enterprise',
  `subscription_status` ENUM('active', 'trial', 'past_due', 'suspended') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. RBAC: Roles & Permissions
CREATE TABLE IF NOT EXISTS `roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `is_system` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(100) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id` BIGINT UNSIGNED NOT NULL,
  `permission_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  CONSTRAINT `fk_rp_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rp_perm` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Organization Structure
CREATE TABLE IF NOT EXISTS `departments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dept_company_code` (`company_id`, `code`),
  CONSTRAINT `fk_dept_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `positions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `department_id` BIGINT UNSIGNED NULL,
  `title` VARCHAR(150) NOT NULL,
  `code` VARCHAR(50) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_pos_dept` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `locations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `name` VARCHAR(150) NOT NULL,
  `address` TEXT NULL,
  `city` VARCHAR(100) NULL,
  `state` VARCHAR(100) NULL,
  `latitude` DECIMAL(10, 8) NULL,
  `longitude` DECIMAL(11, 8) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Users & Registration Approvals
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(36) NOT NULL UNIQUE,
  `company_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `avatar_url` TEXT NULL,
  `role_id` BIGINT UNSIGNED NOT NULL,
  `is_super_admin` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('active', 'pending_approval', 'suspended', 'archived') NOT NULL DEFAULT 'active',
  `last_login_at` TIMESTAMP NULL,
  `last_seen_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_user_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `registration_requests` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(36) NOT NULL UNIQUE,
  `company_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `requested_role` VARCHAR(50) NOT NULL,
  `department_id` BIGINT UNSIGNED NULL,
  `job_title` VARCHAR(150) NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `password_hash` VARCHAR(255) NOT NULL,
  `reviewed_by` BIGINT UNSIGNED NULL,
  `reviewed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL UNIQUE,
  `expires_at` TIMESTAMP NOT NULL,
  `used_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_pwd_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Employees
CREATE TABLE IF NOT EXISTS `employees` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(36) NOT NULL UNIQUE,
  `company_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `user_id` BIGINT UNSIGNED NOT NULL UNIQUE,
  `employee_code` VARCHAR(50) NOT NULL UNIQUE,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `gender` ENUM('male', 'female', 'other', 'prefer_not_to_say') DEFAULT 'prefer_not_to_say',
  `phone` VARCHAR(50) NULL,
  `department_id` BIGINT UNSIGNED NULL,
  `position_id` BIGINT UNSIGNED NULL,
  `location_id` BIGINT UNSIGNED NULL,
  `employment_type` ENUM('full_time', 'part_time', 'contract', 'intern', 'temporary') NOT NULL DEFAULT 'full_time',
  `employment_status` ENUM('active', 'probation', 'notice_period', 'terminated', 'archived') NOT NULL DEFAULT 'active',
  `hire_date` DATE NOT NULL,
  `is_field_agent` TINYINT(1) NOT NULL DEFAULT 0,
  `is_sales_agent` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_emp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_emp_dept` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_emp_pos` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Time & Attendance
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(36) NOT NULL UNIQUE,
  `company_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `employee_id` BIGINT UNSIGNED NOT NULL,
  `attendance_date` DATE NOT NULL,
  `clock_in_at` TIMESTAMP NULL,
  `clock_out_at` TIMESTAMP NULL,
  `clock_in_lat` DECIMAL(10, 8) NULL,
  `clock_in_lng` DECIMAL(11, 8) NULL,
  `clock_out_lat` DECIMAL(10, 8) NULL,
  `clock_out_lng` DECIMAL(11, 8) NULL,
  `work_minutes` INT NOT NULL DEFAULT 0,
  `overtime_minutes` INT NOT NULL DEFAULT 0,
  `status` ENUM('present', 'late', 'absent', 'half_day', 'on_leave') NOT NULL DEFAULT 'present',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_emp_date` (`employee_id`, `attendance_date`),
  CONSTRAINT `fk_att_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Leave Management
CREATE TABLE IF NOT EXISTS `leave_types` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `days_allowed_per_year` INT NOT NULL DEFAULT 20,
  `color` VARCHAR(20) DEFAULT '#0284c7',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `leave_balances` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `employee_id` BIGINT UNSIGNED NOT NULL,
  `leave_type_id` BIGINT UNSIGNED NOT NULL,
  `fiscal_year` INT NOT NULL DEFAULT 2026,
  `entitled_days` DECIMAL(4, 1) NOT NULL DEFAULT 20.0,
  `used_days` DECIMAL(4, 1) NOT NULL DEFAULT 0.0,
  `pending_days` DECIMAL(4, 1) NOT NULL DEFAULT 0.0,
  `remaining_days` DECIMAL(4, 1) NOT NULL DEFAULT 20.0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_emp_leave_year` (`employee_id`, `leave_type_id`, `fiscal_year`),
  CONSTRAINT `fk_lb_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lb_type` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `leave_requests` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `employee_id` BIGINT UNSIGNED NOT NULL,
  `leave_type_id` BIGINT UNSIGNED NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `days_count` DECIMAL(4, 1) NOT NULL DEFAULT 1.0,
  `reason` TEXT NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  `reviewed_by` BIGINT UNSIGNED NULL,
  `reviewed_at` TIMESTAMP NULL,
  `reviewer_notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_lr_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lr_type` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Sales Force & Field Operations: Markets, Streets, Routes, Customers
CREATE TABLE IF NOT EXISTS `markets` (
  `id` VARCHAR(100) NOT NULL,
  `company_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `name` VARCHAR(255) NOT NULL,
  `zone` VARCHAR(100) NULL,
  `state` VARCHAR(100) NULL,
  `region` VARCHAR(100) NULL,
  `coverage_target` INT NOT NULL DEFAULT 100,
  `manager_id` VARCHAR(100) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `streets` (
  `id` VARCHAR(100) NOT NULL,
  `market_id` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `target_visits` INT NOT NULL DEFAULT 15,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_street_market` FOREIGN KEY (`market_id`) REFERENCES `markets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `routes` (
  `id` VARCHAR(100) NOT NULL,
  `company_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `market_id` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `agent_id` VARCHAR(100) NULL,
  `supervisor_id` VARCHAR(100) NULL,
  `start_time` VARCHAR(10) DEFAULT '08:00',
  `end_time` VARCHAR(10) DEFAULT '17:00',
  `completion` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `street_ids` JSON NULL,
  `waypoints` JSON NULL,
  `history` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customers` (
  `id` VARCHAR(100) NOT NULL,
  `company_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `market_id` VARCHAR(100) NULL,
  `street_id` VARCHAR(100) NULL,
  `customer_type` VARCHAR(50) NOT NULL DEFAULT 'Retailer',
  `product_interest` JSON NULL,
  `notes` TEXT NULL,
  `photo_url` TEXT NULL,
  `latitude` DECIMAL(10, 8) NULL,
  `longitude` DECIMAL(11, 8) NULL,
  `balance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `last_visit_at` TIMESTAMP NULL,
  `assigned_agent_id` VARCHAR(100) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `sku` VARCHAR(100) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `unit` VARCHAR(50) NOT NULL DEFAULT 'pack',
  `price` DECIMAL(12, 2) NOT NULL,
  `cost_price` DECIMAL(12, 2) NULL,
  `stock_quantity` INT NOT NULL DEFAULT 100,
  `description` TEXT NULL,
  `image_url` TEXT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(100) NOT NULL,
  `company_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `customer_id` VARCHAR(100) NOT NULL,
  `agent_id` VARCHAR(100) NULL,
  `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `total` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `paid_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `commission` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'transfer',
  `payment_status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `status` VARCHAR(50) NOT NULL DEFAULT 'submitted',
  `items` JSON NOT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `field_visits` (
  `id` VARCHAR(100) NOT NULL,
  `company_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `customer_id` VARCHAR(100) NOT NULL,
  `route_id` VARCHAR(100) NULL,
  `agent_id` VARCHAR(100) NOT NULL,
  `check_in_at` TIMESTAMP NULL,
  `check_out_at` TIMESTAMP NULL,
  `duration_minutes` INT NOT NULL DEFAULT 0,
  `latitude` DECIMAL(10, 8) NULL,
  `longitude` DECIMAL(11, 8) NULL,
  `proof_photo_url` TEXT NULL,
  `notes` TEXT NULL,
  `customer_feedback` TEXT NULL,
  `order_id` VARCHAR(100) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'completed',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` VARCHAR(100) NOT NULL,
  `company_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `plate_number` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `driver_id` VARCHAR(100) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `fuel_level` INT NOT NULL DEFAULT 75,
  `odometer` INT NOT NULL DEFAULT 0,
  `mileage_today` INT NOT NULL DEFAULT 0,
  `latitude` DECIMAL(10, 8) NULL,
  `longitude` DECIMAL(11, 8) NULL,
  `last_movement_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `trip_logs` (
  `id` VARCHAR(100) NOT NULL,
  `vehicle_id` VARCHAR(100) NOT NULL,
  `driver_id` VARCHAR(100) NOT NULL,
  `route_id` VARCHAR(100) NULL,
  `start_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_at` TIMESTAMP NULL,
  `start_mileage` INT NOT NULL DEFAULT 0,
  `end_mileage` INT NOT NULL DEFAULT 0,
  `fuel_purchased` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `inspection` JSON NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `gps_path` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` VARCHAR(100) NOT NULL,
  `company_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `assignee_id` VARCHAR(100) NULL,
  `created_by` VARCHAR(100) NULL,
  `due_date` VARCHAR(50) NULL,
  `priority` VARCHAR(50) NOT NULL DEFAULT 'medium',
  `status` VARCHAR(50) NOT NULL DEFAULT 'todo',
  `comments` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `alerts` (
  `id` VARCHAR(100) NOT NULL,
  `company_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `type` VARCHAR(100) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `severity` VARCHAR(50) NOT NULL DEFAULT 'medium',
  `status` VARCHAR(50) NOT NULL DEFAULT 'open',
  `subject_id` VARCHAR(100) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `user_id` BIGINT UNSIGNED NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(100) NOT NULL,
  `entity_id` VARCHAR(100) NULL,
  `ip_address` VARCHAR(50) NULL,
  `user_agent` TEXT NULL,
  `details` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Additive ERP, CRM and document-governance operations
CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `company_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL, `contact_name` VARCHAR(255) NULL, `email` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL, `address` TEXT NULL, `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  `created_by_id` BIGINT UNSIGNED NULL, `created_by_name` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), KEY `idx_suppliers_company` (`company_id`, `status`),
  CONSTRAINT `fk_supplier_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `purchase_requisitions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `company_id` BIGINT UNSIGNED NOT NULL,
  `requisition_number` VARCHAR(80) NOT NULL, `title` VARCHAR(255) NOT NULL, `description` TEXT NULL,
  `requested_by` VARCHAR(255) NULL, `total_amount` DECIMAL(18,2) NOT NULL DEFAULT 0, `status` VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  `created_by_id` BIGINT UNSIGNED NULL, `created_by_name` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_pr_company_number` (`company_id`, `requisition_number`),
  CONSTRAINT `fk_pr_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `company_id` BIGINT UNSIGNED NOT NULL,
  `po_number` VARCHAR(80) NOT NULL, `supplier_id` BIGINT UNSIGNED NULL, `supplier_name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL, `total_amount` DECIMAL(18,2) NOT NULL DEFAULT 0, `expected_date` DATE NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'DRAFT', `created_by_id` BIGINT UNSIGNED NULL, `created_by_name` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_po_company_number` (`company_id`, `po_number`), KEY `idx_po_company` (`company_id`, `status`),
  CONSTRAINT `fk_po_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_po_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `goods_receipts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `company_id` BIGINT UNSIGNED NOT NULL,
  `receipt_number` VARCHAR(80) NOT NULL, `purchase_order_id` BIGINT UNSIGNED NULL, `reference_number` VARCHAR(100) NOT NULL,
  `notes` TEXT NULL, `status` VARCHAR(50) NOT NULL DEFAULT 'RECEIVED', `created_by_id` BIGINT UNSIGNED NULL, `created_by_name` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_grn_company_number` (`company_id`, `receipt_number`),
  CONSTRAINT `fk_grn_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_grn_po` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `invoices` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `company_id` BIGINT UNSIGNED NOT NULL,
  `invoice_number` VARCHAR(80) NOT NULL, `customer_name` VARCHAR(255) NOT NULL, `description` TEXT NULL, `due_date` DATE NULL,
  `total_amount` DECIMAL(18,2) NOT NULL DEFAULT 0, `amount_paid` DECIMAL(18,2) NOT NULL DEFAULT 0, `balance_due` DECIMAL(18,2) NOT NULL DEFAULT 0,
  `status` VARCHAR(50) NOT NULL DEFAULT 'DRAFT', `created_by_id` BIGINT UNSIGNED NULL, `created_by_name` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_invoice_company_number` (`company_id`, `invoice_number`), KEY `idx_invoice_company` (`company_id`, `status`, `due_date`),
  CONSTRAINT `fk_invoice_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `company_id` BIGINT UNSIGNED NOT NULL,
  `subject` VARCHAR(255) NOT NULL, `description` TEXT NULL, `category` VARCHAR(80) NULL, `priority` VARCHAR(30) NOT NULL DEFAULT 'MEDIUM',
  `status` VARCHAR(50) NOT NULL DEFAULT 'OPEN', `assigned_to_id` BIGINT UNSIGNED NULL, `created_by_id` BIGINT UNSIGNED NULL, `created_by_name` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), KEY `idx_ticket_company` (`company_id`, `status`, `priority`),
  CONSTRAINT `fk_ticket_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `projects` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `company_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL, `description` TEXT NULL, `client_name` VARCHAR(255) NULL, `manager_id` BIGINT UNSIGNED NULL,
  `budget_amount` DECIMAL(18,2) NOT NULL DEFAULT 0, `start_date` DATE NULL, `end_date` DATE NULL, `status` VARCHAR(50) NOT NULL DEFAULT 'PLANNING',
  `created_by_id` BIGINT UNSIGNED NULL, `created_by_name` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), KEY `idx_project_company` (`company_id`, `status`),
  CONSTRAINT `fk_project_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `marketing_campaigns` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `company_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL, `channel` VARCHAR(50) NULL, `audience` VARCHAR(255) NULL, `budget_amount` DECIMAL(18,2) NOT NULL DEFAULT 0,
  `starts_at` DATETIME NULL, `ends_at` DATETIME NULL, `status` VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  `created_by_id` BIGINT UNSIGNED NULL, `created_by_name` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), CONSTRAINT `fk_campaign_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `automation_workflows` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `company_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL, `description` TEXT NULL, `trigger_event` VARCHAR(100) NOT NULL DEFAULT 'manual',
  `status` VARCHAR(50) NOT NULL DEFAULT 'DRAFT', `is_active` TINYINT(1) NOT NULL DEFAULT 0,
  `created_by_id` BIGINT UNSIGNED NULL, `created_by_name` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), CONSTRAINT `fk_workflow_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `integration_connections` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `company_id` BIGINT UNSIGNED NOT NULL,
  `provider` VARCHAR(100) NOT NULL, `connection_name` VARCHAR(255) NOT NULL, `status` VARCHAR(50) NOT NULL DEFAULT 'DISCONNECTED',
  `last_synced_at` DATETIME NULL, `created_by_id` BIGINT UNSIGNED NULL, `created_by_name` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_integration_company_provider_name` (`company_id`, `provider`, `connection_name`),
  CONSTRAINT `fk_integration_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `calendar_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `company_id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL, `description` TEXT NULL, `starts_at` DATETIME NOT NULL, `ends_at` DATETIME NULL,
  `event_type` VARCHAR(50) NULL, `status` VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
  `created_by_id` BIGINT UNSIGNED NULL, `created_by_name` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), KEY `idx_calendar_company` (`company_id`, `starts_at`),
  CONSTRAINT `fk_calendar_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `document_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `company_id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL, `category` VARCHAR(80) NOT NULL DEFAULT 'GENERAL', `description` TEXT NULL,
  `owner_name` VARCHAR(255) NULL, `storage_path` TEXT NULL, `retention_until` DATE NULL, `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  `created_by_id` BIGINT UNSIGNED NULL, `created_by_name` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), KEY `idx_document_company` (`company_id`, `category`, `status`, `retention_until`),
  CONSTRAINT `fk_document_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
