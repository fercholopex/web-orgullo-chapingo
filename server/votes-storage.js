import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { databaseIsConfigured, databasePool } from "./database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const votesFilePath = path.join(dataDir, "votes.json");

const INITIAL_BASE_VOTES = 376;

let cachedData = null;
let mysqlTableChecked = false;

async function ensureDataFile() {
  if (cachedData) return cachedData;
  try {
    await fs.mkdir(dataDir, { recursive: true });
    const content = await fs.readFile(votesFilePath, "utf8");
    cachedData = JSON.parse(content);
  } catch {
    cachedData = {
      baseCount: INITIAL_BASE_VOTES,
      extraVotes: 0,
      votedTokens: []
    };
    try {
      await fs.writeFile(votesFilePath, JSON.stringify(cachedData, null, 2), "utf8");
    } catch (err) {
      console.error("[votes-storage] No se pudo guardar votes.json inicial:", err.message);
    }
  }
  return cachedData;
}

async function saveFile() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(votesFilePath, JSON.stringify(cachedData, null, 2), "utf8");
  } catch (err) {
    console.error("[votes-storage] Error guardando votes.json:", err.message);
  }
}

async function ensureMysqlTable(pool) {
  if (mysqlTableChecked || !pool) return;
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS community_general_votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token_hash CHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_token (token_hash)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    mysqlTableChecked = true;
  } catch (err) {
    console.error("[votes-storage] Error inicializando tabla MySQL de votos:", err.message);
  }
}

export async function getGeneralVotes(tokenHash = null) {
  const data = await ensureDataFile();
  const pool = databaseIsConfigured() ? databasePool() : null;

  let total = data.baseCount + data.extraVotes + data.votedTokens.length;
  let supported = tokenHash ? data.votedTokens.includes(tokenHash) : false;

  if (pool) {
    try {
      await ensureMysqlTable(pool);
      const [countRows] = await pool.execute("SELECT COUNT(*) AS total FROM community_general_votes");
      const mysqlCount = Number(countRows[0]?.total || 0);
      total = Math.max(total, data.baseCount + mysqlCount);

      if (tokenHash) {
        const [tokenRows] = await pool.execute(
          "SELECT 1 FROM community_general_votes WHERE token_hash = ? LIMIT 1",
          [tokenHash]
        );
        if (tokenRows.length > 0) {
          supported = true;
        }
      }
    } catch (err) {
      console.warn("[votes-storage] Fallback a archivo local:", err.message);
    }
  }

  return { total, supported };
}

export async function registerGeneralVote(tokenHash) {
  const data = await ensureDataFile();
  const pool = databaseIsConfigured() ? databasePool() : null;

  // ── Verificar si ya votó (archivo local) ──────────────────────────────────
  if (tokenHash && data.votedTokens.includes(tokenHash)) {
    return await getGeneralVotes(tokenHash); // Sin incremento
  }

  // ── Verificar si ya votó (MySQL) ──────────────────────────────────────────
  if (pool && tokenHash) {
    try {
      await ensureMysqlTable(pool);
      const [rows] = await pool.execute(
        "SELECT 1 FROM community_general_votes WHERE token_hash = ? LIMIT 1",
        [tokenHash]
      );
      if (rows.length > 0) {
        return await getGeneralVotes(tokenHash); // Sin incremento
      }
    } catch (err) {
      console.warn("[votes-storage] Verificación MySQL fallida, usando archivo local:", err.message);
    }
  }

  // ── Voto nuevo ─────────────────────────────────────────────────────────────
  if (tokenHash) {
    data.votedTokens.push(tokenHash);
  } else {
    data.extraVotes = (data.extraVotes || 0) + 1;
  }

  await saveFile();

  if (pool) {
    try {
      await ensureMysqlTable(pool);
      if (tokenHash) {
        await pool.execute(
          "INSERT IGNORE INTO community_general_votes (token_hash) VALUES (?)",
          [tokenHash]
        );
      }
    } catch (err) {
      console.warn("[votes-storage] Error guardando voto en MySQL (guardado en archivo):", err.message);
    }
  }

  return await getGeneralVotes(tokenHash);
}

