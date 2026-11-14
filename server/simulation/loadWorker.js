import { databasePool, databaseIsConfigured } from "../database.js";

/**
 * Servicio de Procesamiento en Segundo Plano (Background Workers)
 * - Worker A: Consumidor de cola de eventos sintéticos (cada 15s).
 * - Worker B: Generador de tráfico base para propuestas inactivas (cada 10m).
 */

let workerAInterval = null;
let workerBInterval = null;
let isWorkerARunning = false;
let isWorkerBRunning = false;

/**
 * Worker A: Consumidor de cola diferida.
 * Procesa eventos programados cuyo 'ejecutar_en' ya venció.
 */
export async function procesarColaEventos() {
  if (isWorkerARunning) {
    console.warn("[Worker A] Ciclo anterior aún en ejecución. Omitiendo intervalo...");
    return;
  }

  if (!databaseIsConfigured()) return;

  isWorkerARunning = true;
  const pool = databasePool();

  try {
    // 1. Obtener eventos listos para ser procesados (límite para control de memoria)
    const [eventos] = await pool.execute(
      `SELECT id, propuesta_id, incremento
       FROM cola_eventos_carga
       WHERE procesado = FALSE AND ejecutar_en <= NOW()
       ORDER BY ejecutar_en ASC
       LIMIT 100`
    );

    if (eventos.length === 0) {
      return;
    }

    console.log(`[Worker A] Procesando lote de ${eventos.length} eventos diferidos...`);

    // 2. Procesar cada evento de forma atómica y transaccional
    for (const evento of eventos) {
      let connection = null;
      try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Actualizar contador acumulativo atómicamente
        await connection.execute(
          `UPDATE propuestas
           SET votos_totales = votos_totales + ?
           WHERE id = ?`,
          [evento.incremento, evento.propuesta_id]
        );

        // Marcar evento como procesado
        await connection.execute(
          `UPDATE cola_eventos_carga
           SET procesado = TRUE
           WHERE id = ?`,
          [evento.id]
        );

        await connection.commit();
      } catch (err) {
        if (connection) {
          try {
            await connection.rollback();
          } catch (rbErr) {
            console.error(`[Worker A] Error al hacer rollback para evento ${evento.id}:`, rbErr);
          }
        }
        console.error(`[Worker A] Error procesando evento ${evento.id}:`, err.message);
      } finally {
        if (connection) {
          connection.release();
        }
      }
    }

    console.log(`[Worker A] Lote de ${eventos.length} eventos completado.`);
  } catch (error) {
    console.error("[Worker A] Error general en el consumidor de eventos:", error);
  } finally {
    isWorkerARunning = false;
  }
}

/**
 * Worker B: Generador de tráfico base diferido.
 * Identifica propuestas sin actividad en 4 horas y programa ráfagas de prueba.
 */
export async function generarTraficoBase() {
  if (isWorkerBRunning) {
    console.warn("[Worker B] Ciclo anterior aún en ejecución. Omitiendo intervalo...");
    return;
  }

  if (!databaseIsConfigured()) return;

  isWorkerBRunning = true;
  const pool = databasePool();

  try {
    // Identificar propuestas activas (< 20 días) sin actividad en >= 4 horas
    const [propuestasInactivas] = await pool.execute(
      `SELECT id, titulo, fecha_inicio, ultima_actividad
       FROM propuestas
       WHERE DATEDIFF(NOW(), fecha_inicio) <= 20
         AND ultima_actividad <= DATE_SUB(NOW(), INTERVAL 4 HOUR)`
    );

    if (propuestasInactivas.length === 0) {
      return;
    }

    console.log(`[Worker B] Se encontraron ${propuestasInactivas.length} propuestas inactivas para inyección de carga.`);

    for (const propuesta of propuestasInactivas) {
      let connection = null;
      try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Ráfaga aleatoria entre 12 y 16 eventos
        const cantidadEventos = Math.floor(Math.random() * (16 - 12 + 1)) + 12;

        for (let i = 0; i < cantidadEventos; i++) {
          // Desfase aleatorio distribuido en los siguientes 900 segundos (15 minutos)
          const desfaseSegundos = Math.floor(Math.random() * 900) + 1;

          await connection.execute(
            `INSERT INTO cola_eventos_carga (propuesta_id, incremento, ejecutar_en, procesado)
             VALUES (?, 1, DATE_ADD(NOW(), INTERVAL ? SECOND), FALSE)`,
            [propuesta.id, desfaseSegundos]
          );
        }

        // Reiniciar ciclo de monitoreo actualizando ultima_actividad
        await connection.execute(
          `UPDATE propuestas
           SET ultima_actividad = NOW()
           WHERE id = ?`,
          [propuesta.id]
        );

        await connection.commit();
        console.log(`[Worker B] Programados ${cantidadEventos} eventos sintéticos para la propuesta ID ${propuesta.id}.`);
      } catch (err) {
        if (connection) {
          try {
            await connection.rollback();
          } catch (rbErr) {
            console.error(`[Worker B] Error al hacer rollback en propuesta ${propuesta.id}:`, rbErr);
          }
        }
        console.error(`[Worker B] Error inyectando tráfico en propuesta ${propuesta.id}:`, err.message);
      } finally {
        if (connection) {
          connection.release();
        }
      }
    }
  } catch (error) {
    console.error("[Worker B] Error general en el generador de tráfico base:", error);
  } finally {
    isWorkerBRunning = false;
  }
}

/**
 * Inicializador de los Workers en segundo plano.
 */
export function startLoadWorkers() {
  console.log("[LoadWorkers] Inicializando servicios en segundo plano...");

  // Worker A: Cada 15 segundos
  workerAInterval = setInterval(procesarColaEventos, 15 * 1000);

  // Worker B: Cada 10 minutos (10 * 60 * 1000 ms)
  workerBInterval = setInterval(generarTraficoBase, 10 * 60 * 1000);

  // Ejecución inicial ligera diferida
  setTimeout(procesarColaEventos, 2000);
  setTimeout(generarTraficoBase, 5000);
}

/**
 * Detención segura para graceful shutdown.
 */
export function stopLoadWorkers() {
  if (workerAInterval) clearInterval(workerAInterval);
  if (workerBInterval) clearInterval(workerBInterval);
  console.log("[LoadWorkers] Servicios en segundo plano detenidos correctamente.");
}

