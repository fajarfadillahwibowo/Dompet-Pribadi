-- Setup MySQL database and transactions table for Fina App
CREATE DATABASE IF NOT EXISTS `fina_app` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `fina_app`;

CREATE TABLE IF NOT EXISTS `transactions` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `type` ENUM('income', 'expense') NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `description` TEXT NULL,
    `date` DATE NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `embedding` JSON NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_transactions_date` (`date`),
    INDEX `idx_transactions_type` (`type`),
    INDEX `idx_transactions_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
