-- =============================================================================
-- BASE DE DATOS: TEAM CHAPINGO (PRODUCCIÓN / HOSTING / CPANEL / HPANEL)
-- Juego de caracteres: UTF-8 Unicode (utf8mb4)
-- =============================================================================

-- 0. Creación de la base de datos y usuario sin contraseña
CREATE DATABASE IF NOT EXISTS `bd-orgullochapingo`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bd-orgullochapingo`;

-- Crear usuario 'us-orgullochapingo' sin contraseña y otorgarle todos los privilegios
CREATE USER IF NOT EXISTS 'us-orgullochapingo'@'localhost' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON `bd-orgullochapingo`.* TO 'us-orgullochapingo'@'localhost';

CREATE USER IF NOT EXISTS 'us-orgullochapingo'@'127.0.0.1' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON `bd-orgullochapingo`.* TO 'us-orgullochapingo'@'127.0.0.1';

CREATE USER IF NOT EXISTS 'us-orgullochapingo'@'%' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON `bd-orgullochapingo`.* TO 'us-orgullochapingo'@'%';

FLUSH PRIVILEGES;

-- 1. Propuestas y comentarios de la comunidad universitaria
-- Si el autor no especifica su rol o nombre, se asigna por defecto 'Anónimo'.
-- Las propuestas aprobadas se muestran públicamente en propuestas.html.
CREATE TABLE IF NOT EXISTS community_proposals (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  community_role VARCHAR(64) NOT NULL DEFAULT 'Anónimo',
  proposal_text TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_community_proposals_status_created (status, published_at, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Registro de votos a favor por propuesta individual
-- Cada navegador puede apoyar una sola vez cada propuesta aprobada mediante un token hash.
CREATE TABLE IF NOT EXISTS community_proposal_supports (
  proposal_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (proposal_id, token_hash),
  KEY idx_community_proposal_supports_created_at (created_at),
  CONSTRAINT fk_community_proposal_supports_proposal
    FOREIGN KEY (proposal_id) REFERENCES community_proposals (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Control de ráfagas y anti-spam (Límite temporal por huella HMAC)
CREATE TABLE IF NOT EXISTS community_proposal_rate_limits (
  ip_fingerprint CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  last_submission_at DATETIME NOT NULL,
  PRIMARY KEY (ip_fingerprint),
  KEY idx_community_proposal_rate_limits_time (last_submission_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Registro de votos a favor generales del proyecto / candidatura
CREATE TABLE IF NOT EXISTS community_general_votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_general_votes_token (token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Módulo de Simulación de Carga y Benchmarking (Propuestas)
CREATE TABLE IF NOT EXISTS propuestas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  votos_totales INT NOT NULL DEFAULT 0,
  fecha_inicio DATETIME NOT NULL,
  ultima_actividad DATETIME NOT NULL,
  INDEX idx_propuestas_actividad (fecha_inicio, ultima_actividad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Cola de eventos sintéticos diferidos para evaluación de rendimiento
CREATE TABLE IF NOT EXISTS cola_eventos_carga (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  propuesta_id INT UNSIGNED NOT NULL,
  incremento INT NOT NULL DEFAULT 1,
  ejecutar_en DATETIME NOT NULL,
  procesado BOOLEAN NOT NULL DEFAULT FALSE,
  INDEX idx_cola_pendientes (procesado, ejecutar_en),
  INDEX idx_cola_propuesta (propuesta_id),
  CONSTRAINT fk_cola_propuestas_benchmark
    FOREIGN KEY (propuesta_id) REFERENCES propuestas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Datos semilla iniciales (Propuestas propositivas de la comunidad)
-- -----------------------------------------------------------------------------
INSERT INTO community_proposals (community_role, proposal_text, status, published_at)
SELECT 'Estudiante de Fitotecnia', 'Rehabilitación y mantenimiento constante a los laboratorios de biología y campo experimental.', 'approved', NOW()
WHERE NOT EXISTS (SELECT 1 FROM community_proposals LIMIT 1);

INSERT INTO community_proposals (community_role, proposal_text, status, published_at)
SELECT 'Anónimo', 'Internet de alta velocidad y cobertura en todos los dormitorios del internado y zonas comunes.', 'approved', NOW()
WHERE (SELECT COUNT(*) FROM community_proposals) = 1;

INSERT INTO community_proposals (community_role, proposal_text, status, published_at)
SELECT 'Docente Investigador', 'Transparencia en la asignación de viáticos y recursos para salidas de estudio y prácticas de campo.', 'approved', NOW()
WHERE (SELECT COUNT(*) FROM community_proposals) = 2;
