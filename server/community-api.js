import { createHash, createHmac } from "node:crypto";
import express from "express";
import { databaseIsConfigured, databasePool } from "./database.js";
import { getGeneralVotes, registerGeneralVote } from "./votes-storage.js";

const router = express.Router();
const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function setApiHeaders(_request, response, next) {
  response.set({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "X-Content-Type-Options": "nosniff"
  });
  next();
}

function respond(response, status, payload) {
  response.status(status).json(payload);
}

function originIsAllowed(request) {
  const origin = request.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).hostname.toLowerCase() === request.hostname.toLowerCase();
  } catch {
    return false;
  }
}

function readTokenHash(value) {
  if (typeof value !== "string" || !uuidV4Pattern.test(value)) {
    return null;
  }
  return createHash("sha256").update(value.toLowerCase()).digest("hex");
}

function readProposalId(value) {
  if (!(typeof value === "number" || (typeof value === "string" && /^\d+$/.test(value)))) {
    return null;
  }
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function containsProfanity(text) {
  if (!text || typeof text !== "string") return false;
  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[04@]/g, "a")
    .replace(/[3]/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/[0]/g, "o")
    .replace(/[5$]/g, "s")
    .replace(/[*_.\-+]/g, "");

  const patterns = [
    /\b(chinga[rdonasm]?|chingue[sn]?|chingad[oa]s?|chingader[as]?|chingon(a|es|as)?)\b/i,
    /\b(pendej[oa]s?|pendejad[as]?)\b/i,
    /\b(put[oa]s?|putaz[oa]s?|putamadre)\b/i,
    /\b(verg[as]|vergaz[oa]s?|verguiz[as]?)\b/i,
    /\b(mierd[as]?)\b/i,
    /\b(culer[oa]s?|cul[oa]s?)\b/i,
    /\b(cabron(a|es|as)?|cabronad[as]?)\b/i,
    /\b(estupid[oa]s?|idiot(a|as|o|os)?|imbecil(es)?|tarad[oa]s?)\b/i,
    /\b(pinch[es]?|mamon(a|es|as)?|mamad[as]?)\b/i,
    /\b(maricon(es)?|puñet[as]?|perr[as]?|zorr[as]?)\b/i
  ];

  return patterns.some((p) => p.test(normalized));
}

function configuredPool(response, feature) {
  if (!databaseIsConfigured()) {
    respond(response, 503, {
      ok: false,
      message: `Completa la configuración MySQL para activar ${feature}.`
    });
    return null;
  }
  return databasePool();
}

router.all("/proposals.php", setApiHeaders, async (request, response) => {
  if (!originIsAllowed(request)) {
    return respond(response, 403, { ok: false, message: "Origen de solicitud no permitido." });
  }
  if (!(["GET", "POST"].includes(request.method))) {
    response.set("Allow", "GET, POST");
    return respond(response, 405, { ok: false, message: "Método no permitido." });
  }

  const pool = configuredPool(response, "las propuestas");
  if (!pool) return;

  if (request.method === "GET") {
    const requestedLimit = request.query.limit;
    const parsedLimit = typeof requestedLimit === "string" && /^-?\d+$/.test(requestedLimit)
      ? Number(requestedLimit)
      : 50;
    const limit = Math.max(1, Math.min(100, Number.isSafeInteger(parsedLimit) ? parsedLimit : 50));
    try {
      const [proposals] = await pool.execute(
        `SELECT proposals.id,
                COALESCE(proposals.community_role, 'Anónimo') AS community_role,
                proposals.proposal_text AS proposal,
                DATE_FORMAT(COALESCE(proposals.published_at, proposals.created_at), '%Y-%m-%dT%H:%i:%sZ') AS published_at,
                (SELECT COUNT(*) FROM community_proposal_supports AS supports
                 WHERE supports.proposal_id = proposals.id) AS support_count
         FROM community_proposals AS proposals
         WHERE proposals.status = 'approved'
         ORDER BY proposals.published_at DESC, proposals.id DESC
         LIMIT ?`,
        [limit]
      );
      return respond(response, 200, { ok: true, proposals });
    } catch (error) {
      console.error("[community-proposals]", error);
      return respond(response, 500, { ok: false, message: "No se pudo guardar o cargar la propuesta en este momento." });
    }
  }

  const input = request.body;
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return respond(response, 400, { ok: false, message: "Solicitud inválida." });
  }

  const honeypot = input.website ?? "";
  if (typeof honeypot !== "string") {
    return respond(response, 400, { ok: false, message: "Solicitud inválida." });
  }
  if (honeypot.trim() !== "") {
    return respond(response, 201, { ok: true, status: "pending" });
  }
  if (input.publishConsent !== true) {
    return respond(response, 400, { ok: false, message: "Debes aceptar la revisión y posible publicación de la propuesta." });
  }
  if (typeof input.proposal !== "string") {
    return respond(response, 400, { ok: false, message: "Escribe una propuesta válida." });
  }

  const proposal = input.proposal.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  const hasInvalidSurrogate = [...proposal].some((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint >= 0xd800 && codePoint <= 0xdfff;
  });
  const characterCount = [...proposal].length;
  if (hasInvalidSurrogate) {
    return respond(response, 400, { ok: false, message: "La propuesta debe usar texto válido." });
  }
  if (characterCount < 10 || characterCount > 800) {
    return respond(response, 400, { ok: false, message: "Escribe una propuesta de entre 10 y 800 caracteres." });
  }

  // Si dejan vacío el autor/rol, se asigna 'Anónimo' automáticamente
  const authorInput = typeof input.author === "string"
    ? input.author.trim()
    : (typeof input.community_role === "string" ? input.community_role.trim() : "");
  const communityRole = authorInput.length > 0 ? authorInput.slice(0, 60) : "Anónimo";

  // Filtro de groserías e insultos (solo comentarios constructivos y respetuosos)
  if (containsProfanity(proposal) || containsProfanity(communityRole)) {
    return respond(response, 400, {
      ok: false,
      message: "Tu propuesta contiene palabras inapropiadas. Por favor mantén un lenguaje respetuoso y constructivo para la comunidad universitaria."
    });
  }

  const rateSecret = process.env.PROPOSAL_RATE_SECRET || "";
  if (rateSecret.length < 32 || rateSecret.startsWith("REEMPLAZA_")) {
    return respond(response, 503, { ok: false, message: "Completa la clave anti-spam en la configuración del sitio." });
  }
  const remoteAddress = request.ip || request.socket.remoteAddress || "";
  if (!remoteAddress) {
    return respond(response, 400, { ok: false, message: "No pudimos validar esta solicitud." });
  }

  const fingerprint = createHmac("sha256", rateSecret).update(remoteAddress).digest("hex");
  let connection;
  let transactionOpen = false;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionOpen = true;
    await connection.execute(
      "DELETE FROM community_proposal_rate_limits WHERE last_submission_at < UTC_TIMESTAMP() - INTERVAL 24 HOUR"
    );
    await connection.execute(
      `INSERT IGNORE INTO community_proposal_rate_limits (ip_fingerprint, last_submission_at)
       VALUES (?, '2000-01-01 00:00:00')`,
      [fingerprint]
    );
    const [rows] = await connection.execute(
      `SELECT last_submission_at >= UTC_TIMESTAMP() - INTERVAL 5 MINUTE AS is_limited
       FROM community_proposal_rate_limits WHERE ip_fingerprint = ? FOR UPDATE`,
      [fingerprint]
    );
    if (Number(rows[0]?.is_limited) === 1) {
      await connection.rollback();
      transactionOpen = false;
      return respond(response, 429, { ok: false, message: "Espera unos minutos antes de enviar otra propuesta." });
    }
    await connection.execute(
      `UPDATE community_proposal_rate_limits
       SET last_submission_at = UTC_TIMESTAMP() WHERE ip_fingerprint = ?`,
      [fingerprint]
    );
    await connection.execute(
      `INSERT INTO community_proposals (community_role, proposal_text, status, published_at)
       VALUES (?, ?, 'approved', UTC_TIMESTAMP())`,
      [communityRole, proposal]
    );
    await connection.commit();
    transactionOpen = false;
    return respond(response, 201, {
      ok: true,
      status: "approved",
      message: "¡Gracias! Tu propuesta ha sido publicada con éxito."
    });
  } catch (error) {
    if (connection && transactionOpen) await connection.rollback().catch(() => {});
    console.error("[community-proposals]", error);
    return respond(response, 500, { ok: false, message: "No se pudo guardar o cargar la propuesta en este momento." });
  } finally {
    connection?.release();
  }
});

router.all("/proposal-supports.php", setApiHeaders, async (request, response) => {
  if (!originIsAllowed(request)) {
    return respond(response, 403, { ok: false, message: "Origen de solicitud no permitido." });
  }
  if (request.method !== "POST") {
    response.set("Allow", "POST");
    return respond(response, 405, { ok: false, message: "Método no permitido." });
  }

  const input = request.body;
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return respond(response, 400, { ok: false, message: "Solicitud inválida." });
  }
  const tokenHash = readTokenHash(input.token);
  if (!tokenHash) {
    return respond(response, 400, { ok: false, message: "Identificador de navegador inválido." });
  }
  const pool = configuredPool(response, "los votos a propuestas");
  if (!pool) return;

  try {
    const action = input.action;
    if (action === "statuses") {
      if (!Array.isArray(input.proposalIds) || input.proposalIds.length > 100) {
        return respond(response, 400, { ok: false, message: "La lista de propuestas no es válida." });
      }
      const proposalIds = [...new Set(input.proposalIds.map(readProposalId))];
      if (proposalIds.includes(null)) {
        return respond(response, 400, { ok: false, message: "La propuesta seleccionada no es válida." });
      }
      if (!proposalIds.length) return respond(response, 200, { ok: true, supported_ids: [] });
      const placeholders = proposalIds.map(() => "?").join(",");
      const [rows] = await pool.execute(
        `SELECT supports.proposal_id
         FROM community_proposal_supports AS supports
         INNER JOIN community_proposals AS proposals ON proposals.id = supports.proposal_id
         WHERE supports.token_hash = ? AND proposals.status = 'approved'
           AND supports.proposal_id IN (${placeholders})`,
        [tokenHash, ...proposalIds]
      );
      return respond(response, 200, {
        ok: true,
        supported_ids: rows.map((row) => Number(row.proposal_id))
      });
    }

    if (!["status", "support", "remove"].includes(action)) {
      return respond(response, 400, { ok: false, message: "Acción de voto no reconocida." });
    }
    const proposalId = readProposalId(input.proposalId);
    if (!proposalId) {
      return respond(response, 400, { ok: false, message: "La propuesta seleccionada no es válida." });
    }

    const [available] = await pool.execute(
      "SELECT 1 FROM community_proposals WHERE id = ? AND status = 'approved' LIMIT 1",
      [proposalId]
    );
    if (!available.length) {
      return respond(response, 404, { ok: false, message: "La propuesta ya no está disponible." });
    }
    if (action === "support") {
      await pool.execute(
        "INSERT IGNORE INTO community_proposal_supports (proposal_id, token_hash) VALUES (?, ?)",
        [proposalId, tokenHash]
      );
    } else if (action === "remove") {
      await pool.execute(
        "DELETE FROM community_proposal_supports WHERE proposal_id = ? AND token_hash = ?",
        [proposalId, tokenHash]
      );
    }

    const [stateRows] = await pool.execute(
      `SELECT EXISTS(SELECT 1 FROM community_proposal_supports
         WHERE proposal_id = ? AND token_hash = ?) AS supported,
         (SELECT COUNT(*) FROM community_proposal_supports WHERE proposal_id = ?) AS total`,
      [proposalId, tokenHash, proposalId]
    );
    return respond(response, 200, {
      ok: true,
      proposal_id: proposalId,
      supported: Number(stateRows[0].supported) === 1,
      total: Number(stateRows[0].total)
    });
  } catch (error) {
    console.error("[proposal-supports]", error);
    return respond(response, 500, { ok: false, message: "No se pudo guardar el voto a esta propuesta." });
  }
});

router.all("/votes.php", setApiHeaders, async (request, response) => {
  if (!originIsAllowed(request)) {
    return respond(response, 403, { ok: false, message: "Origen de solicitud no permitido." });
  }

  const tokenParam = request.method === "POST" ? request.body?.token : request.query?.token;
  const tokenHash = typeof tokenParam === "string" ? readTokenHash(tokenParam) : null;

  try {
    if (request.method === "POST") {
      const action = request.body?.action || "vote";
      if (action === "vote" || action === "support") {
        const result = await registerGeneralVote(tokenHash);
        return respond(response, 200, {
          ok: true,
          total: result.total,
          supported: result.supported,
          message: "Voto registrado exitosamente."
        });
      }
    }

    const result = await getGeneralVotes(tokenHash);
    return respond(response, 200, {
      ok: true,
      total: result.total,
      supported: result.supported
    });
  } catch (error) {
    console.error("[votes-api]", error);
    return respond(response, 500, { ok: false, message: "No se pudieron procesar los votos." });
  }
});

export default router;
