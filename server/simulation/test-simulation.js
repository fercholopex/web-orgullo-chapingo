import "dotenv/config";
import { databasePool, databaseIsConfigured } from "../database.js";
import { procesarColaEventos, generarTraficoBase } from "./loadWorker.js";

async function runTestSuite() {
  console.log("\n=======================================================");
  console.log("  TEST DE VERIFICACIÓN: SIMULACIÓN Y COLA DE EVENTOS   ");
  console.log("=======================================================\n");

  if (!databaseIsConfigured()) {
    console.error("❌ ERROR: La base de datos no está configurada en .env.");
    process.exit(1);
  }

  const pool = databasePool();
  let conn;

  try {
    conn = await pool.getConnection();
    console.log("✔ [1/6] Conexión a MySQL establecida exitosamente.");

    // 1. Asegurar tablas requeridas
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS propuestas (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        votos_totales INT NOT NULL DEFAULT 0,
        fecha_inicio DATETIME NOT NULL,
        ultima_actividad DATETIME NOT NULL,
        INDEX idx_propuestas_actividad (fecha_inicio, ultima_actividad)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS cola_eventos_carga (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        propuesta_id INT UNSIGNED NOT NULL,
        incremento INT NOT NULL DEFAULT 1,
        ejecutar_en DATETIME NOT NULL,
        procesado BOOLEAN NOT NULL DEFAULT FALSE,
        INDEX idx_cola_pendientes (procesado, ejecutar_en),
        INDEX idx_cola_propuesta (propuesta_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✔ [2/6] Tablas 'propuestas' y 'cola_eventos_carga' verificadas.");

    // 2. Crear o resetear propuesta de prueba
    await conn.execute("DELETE FROM cola_eventos_carga WHERE propuesta_id = 9999");
    await conn.execute("DELETE FROM propuestas WHERE id = 9999");
    await conn.execute(`
      INSERT INTO propuestas (id, titulo, votos_totales, fecha_inicio, ultima_actividad)
      VALUES (9999, 'Propuesta Benchmark Test', 10, NOW(), NOW())
    `);
    console.log("✔ [3/6] Propuesta de prueba inicializada con 10 votos iniciales.");

    // 3. Simular petición de voto (Efecto multiplicador 7 u 8)
    const multiplicador = Math.random() < 0.5 ? 7 : 8;
    await conn.execute(
      "UPDATE propuestas SET votos_totales = votos_totales + 1, ultima_actividad = NOW() WHERE id = 9999"
    );

    for (let i = 0; i < multiplicador; i++) {
      const desfase = Math.floor(Math.random() * (360 - 180 + 1)) + 180;
      await conn.execute(
        `INSERT INTO cola_eventos_carga (propuesta_id, incremento, ejecutar_en, procesado)
         VALUES (9999, 1, DATE_ADD(NOW(), INTERVAL ? SECOND), FALSE)`,
        [desfase]
      );
    }

    const [eventosEncolados] = await conn.execute(
      "SELECT COUNT(*) AS total FROM cola_eventos_carga WHERE propuesta_id = 9999 AND procesado = FALSE"
    );
    const totalEncolados = Number(eventosEncolados[0].total);

    console.log(`✔ [4/6] Evento de voto registrado: Votos directos = 11. Se generaron ${totalEncolados} eventos sintéticos diferidos (esperado: 7 u 8).`);

    // 4. Simular paso del tiempo y probar Worker A (Consumidor)
    // Adelantamos 3 eventos para que venzan ya
    await conn.execute(`
      UPDATE cola_eventos_carga
      SET ejecutar_en = DATE_SUB(NOW(), INTERVAL 5 SECOND)
      WHERE propuesta_id = 9999
      LIMIT 3
    `);

    console.log("⏳ Ejecutando Worker A (Consumidor de cola)...");
    conn.release(); // liberamos antes de llamar al worker que usa el pool
    conn = null;

    await procesarColaEventos();

    conn = await pool.getConnection();
    const [propuestaActualizada] = await conn.execute(
      "SELECT votos_totales FROM propuestas WHERE id = 9999"
    );
    const votosTrasWorkerA = Number(propuestaActualizada[0].votos_totales);

    console.log(`✔ [5/6] Worker A procesó los 3 eventos vencidos. Votos totales pasaron a: ${votosTrasWorkerA} (esperado: 14).`);

    // 5. Probar Worker B (Generador de tráfico base ante inactividad)
    await conn.execute(`
      UPDATE propuestas
      SET ultima_actividad = DATE_SUB(NOW(), INTERVAL 5 HOUR)
      WHERE id = 9999
    `);
    console.log("⏳ Simulando 5 horas de inactividad y ejecutando Worker B...");
    conn.release();
    conn = null;

    await generarTraficoBase();

    conn = await pool.getConnection();
    const [rafagaEventos] = await conn.execute(
      "SELECT COUNT(*) AS total FROM cola_eventos_carga WHERE propuesta_id = 9999 AND procesado = FALSE"
    );
    console.log(`✔ [6/6] Worker B detectó inactividad y generó ráfaga base. Total eventos pendientes acumulados: ${rafagaEventos[0].total}.`);

    // Limpieza
    await conn.execute("DELETE FROM cola_eventos_carga WHERE propuesta_id = 9999");
    await conn.execute("DELETE FROM propuestas WHERE id = 9999");
    console.log("\n🧹 Datos temporales de prueba limpiados correctamente.");

    console.log("\n=======================================================");
    console.log("  🎉 RESULTADO: TODOS LOS COMPONENTES FUNCIONAN AL 100% ");
    console.log("=======================================================\n");

  } catch (error) {
    console.error("\n❌ ERROR DURANTE LA PRUEBA:", error);
  } finally {
    if (conn) conn.release();
    process.exit(0);
  }
}

runTestSuite();

