import { databasePool, databaseIsConfigured } from "../database.js";

/**
 * Controlador para registrar actividad y generar ráfagas sintéticas reactivas.
 * POST /api/votar
 * 
 * Payload esperado:
 * {
 *   "propuesta_id": 1
 * }
 */
export async function votarController(req, res) {
  const propuestaId = Number(req.body?.propuesta_id);

  if (!Number.isSafeInteger(propuestaId) || propuestaId <= 0) {
    return res.status(400).json({
      ok: false,
      error: "El parámetro 'propuesta_id' debe ser un entero positivo válido."
    });
  }

  if (!databaseIsConfigured()) {
    return res.status(503).json({
      ok: false,
      error: "La conexión a la base de datos MySQL no está configurada."
    });
  }

  const pool = databasePool();
  let connection = null;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Obtener estado de la propuesta y validar ventana de 20 días
    const [rows] = await connection.execute(
      `SELECT id, titulo, votos_totales, fecha_inicio,
              DATEDIFF(NOW(), fecha_inicio) AS dias_transcurridos
       FROM propuestas
       WHERE id = ?
       FOR UPDATE`,
      [propuestaId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        ok: false,
        error: `La propuesta con ID ${propuestaId} no fue encontrada.`
      });
    }

    const propuesta = rows[0];
    const enVentanaDePrueba = Number(propuesta.dias_transcurridos) <= 20;

    // 2. Incrementar voto entrante y actualizar última actividad atómicamente
    await connection.execute(
      `UPDATE propuestas
       SET votos_totales = votos_totales + 1,
           ultima_actividad = NOW()
       WHERE id = ?`,
      [propuestaId]
    );

    let eventosGenerados = 0;

    // 3. Generar eventos sintéticos si está dentro de la ventana de 20 días
    if (enVentanaDePrueba) {
      // 50% de probabilidad entre 7 u 8 eventos
      const multiplicador = Math.random() < 0.5 ? 7 : 8;

      for (let i = 0; i < multiplicador; i++) {
        // Desfase aleatorio entre 180 y 360 segundos (3 a 6 minutos)
        const desfaseSegundos = Math.floor(Math.random() * (360 - 180 + 1)) + 180;

        await connection.execute(
          `INSERT INTO cola_eventos_carga (propuesta_id, incremento, ejecutar_en, procesado)
           VALUES (?, 1, DATE_ADD(NOW(), INTERVAL ? SECOND), FALSE)`,
          [propuestaId, desfaseSegundos]
        );
      }

      eventosGenerados = multiplicador;
    }

    await connection.commit();

    return res.status(200).json({
      ok: true,
      mensaje: "Voto registrado exitosamente.",
      propuesta_id: propuestaId,
      en_ventana_prueba: enVentanaDePrueba,
      eventos_sinteticos_encolados: eventosGenerados,
      votos_actuales: propuesta.votos_totales + 1
    });

  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("[votarController] Error al realizar rollback:", rollbackError);
      }
    }

    console.error("[votarController] Error durante la transacción de voto:", error);
    return res.status(500).json({
      ok: false,
      error: "Ocurrió un error interno al procesar el voto y la simulación de carga."
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

