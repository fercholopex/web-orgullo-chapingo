import mysql from "mysql2/promise";

let pool;

export function databaseIsConfigured() {
  const required = ["DB_HOST", "DB_NAME", "DB_USER"];
  if (required.some((key) => !process.env[key] || process.env[key].startsWith("TU_"))) {
    return false;
  }

  return Object.hasOwn(process.env, "DB_PASSWORD") && !process.env.DB_PASSWORD.startsWith("TU_");
}

export function databasePool() {
  if (!databaseIsConfigured()) return null;
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      charset: "utf8mb4",
      timezone: "Z",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    pool.on("connection", (connection) => {
      connection.query("SET time_zone = '+00:00'", (error) => {
        if (!error) return;
        console.error("[community-api] No se pudo fijar la zona horaria de MySQL.", error);
      });
    });
  }
  return pool;
}
