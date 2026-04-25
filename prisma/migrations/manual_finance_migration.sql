-- ============================================================
-- MIGRACIÓN: Módulo Financiero Completo + IVA Opcional
-- Ejecutar en Hostinger phpMyAdmin → Base de datos: u826363020_crm_laser_inov
-- ============================================================

-- 1. Agregar columna taxable a Quote (IVA opcional)
ALTER TABLE `Quote` 
  ADD COLUMN `taxable` BOOLEAN NOT NULL DEFAULT TRUE AFTER `paymentStatus`;

-- 2. Crear tabla FinancialTransaction
CREATE TABLE `FinancialTransaction` (
  `id`            VARCHAR(191)  NOT NULL,
  `type`          VARCHAR(191)  NOT NULL,
  `category`      VARCHAR(191)  NOT NULL,
  `amount`        DOUBLE        NOT NULL,
  `taxAmount`     DOUBLE        NOT NULL DEFAULT 0,
  `description`   VARCHAR(191)  NOT NULL,
  `notes`         LONGTEXT      NULL,
  `date`          DATETIME(3)   NOT NULL,
  `paymentMethod` VARCHAR(191)  NULL,
  `provider`      VARCHAR(191)  NULL,
  `receiptUrl`    VARCHAR(191)  NULL,
  `quoteId`       VARCHAR(191)  NULL,
  `clientId`      VARCHAR(191)  NULL,
  `createdById`   VARCHAR(191)  NULL,
  `updatedById`   VARCHAR(191)  NULL,
  `isDeleted`     BOOLEAN       NOT NULL DEFAULT FALSE,
  `deletedAt`     DATETIME(3)   NULL,
  `deletedById`   VARCHAR(191)  NULL,
  `deleteReason`  VARCHAR(191)  NULL,
  `status`        VARCHAR(191)  NOT NULL DEFAULT 'ACTIVO',
  `createdAt`     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)   NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `FinancialTransaction_quoteId_idx` (`quoteId`),
  INDEX `FinancialTransaction_clientId_idx` (`clientId`),
  INDEX `FinancialTransaction_createdById_idx` (`createdById`),
  INDEX `FinancialTransaction_deletedById_idx` (`deletedById`),
  INDEX `FinancialTransaction_type_idx` (`type`),
  INDEX `FinancialTransaction_date_idx` (`date`),
  INDEX `FinancialTransaction_isDeleted_idx` (`isDeleted`),

  CONSTRAINT `FinancialTransaction_quoteId_fkey`
    FOREIGN KEY (`quoteId`) REFERENCES `Quote`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FinancialTransaction_clientId_fkey`
    FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FinancialTransaction_createdById_fkey`
    FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FinancialTransaction_deletedById_fkey`
    FOREIGN KEY (`deletedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. (Opcional) Migrar gastos existentes del modelo Expense si existen
-- INSERT INTO `FinancialTransaction` 
--   (`id`, `type`, `category`, `amount`, `description`, `notes`, `date`, `status`, `createdAt`, `updatedAt`)
-- SELECT 
--   `id`, 'GASTO_OPERATIVO', `category`, `amount`, `description`, `notes`, `date`, 'ACTIVO', `createdAt`, `updatedAt`
-- FROM `Expense` 
-- WHERE `active` = TRUE;

-- 4. (Opcional) Eliminar tabla Expense si ya no se usa
-- DROP TABLE IF EXISTS `Expense`;
