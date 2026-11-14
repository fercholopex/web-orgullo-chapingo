-- =============================================================================
-- ESQUEMA DE BASE DE DATOS: SIMULACIÓN DE CARGA Y TRÁFICO SINTÉTICO
-- =============================================================================

-- 1. Tabla de Propuestas bajo evaluación de estrés
CREATE TABLE IF NOT EXISTS propuestas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  votos_totales INT NOT NULL DEFAULT 0,
  fecha_inicio DATETIME NOT NULL,
  ultima_actividad DATETIME NOT NULL,
  INDEX idx_propuestas_actividad (fecha_inicio, ultima_actividad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla de Cola de Eventos de Carga Programados
CREATE TABLE IF NOT EXISTS cola_eventos_carga (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  propuesta_id INT UNSIGNED NOT NULL,
  incremento INT NOT NULL DEFAULT 1,
  ejecutar_en DATETIME NOT NULL,
  procesado BOOLEAN NOT NULL DEFAULT FALSE,
  INDEX idx_cola_pendientes (procesado, ejecutar_en),
  INDEX idx_cola_propuesta (propuesta_id),
  CONSTRAINT fk_cola_propuesta FOREIGN KEY (propuesta_id)
    REFERENCES propuestas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

