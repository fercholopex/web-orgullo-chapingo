<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST');
    respond(405, ['ok' => false, 'message' => 'Método no permitido.']);
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$requestHost = strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
if ($origin !== '') {
    $originHost = strtolower((string) parse_url($origin, PHP_URL_HOST));
    if ($originHost === '' || $requestHost === '' || !hash_equals($requestHost, $originHost)) {
        respond(403, ['ok' => false, 'message' => 'Origen de solicitud no permitido.']);
    }
}

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    respond(503, ['ok' => false, 'message' => 'El registro comunitario aún no está configurado.']);
}

$config = require $configPath;
$requiredConfig = ['db_host', 'db_name', 'db_user'];
if (!is_array($config)) {
    respond(503, ['ok' => false, 'message' => 'La configuración de la base de datos no es válida.']);
}
foreach ($requiredConfig as $key) {
    if (!isset($config[$key]) || !is_string($config[$key]) || $config[$key] === '' || strpos($config[$key], 'TU_') === 0) {
        respond(503, ['ok' => false, 'message' => 'Completa la configuración MySQL para activar las propuestas.']);
    }
}
if (!array_key_exists('db_password', $config) || !is_string($config['db_password']) || strpos($config['db_password'], 'TU_') === 0) {
    respond(503, ['ok' => false, 'message' => 'Completa la configuración MySQL para activar las propuestas.']);
}

try {
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_name']);
    $pdo = new PDO($dsn, $config['db_user'], $config['db_password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $pdo->exec("SET time_zone = '+00:00'");

    if ($method === 'GET') {
        $limit = filter_var($_GET['limit'] ?? 50, FILTER_VALIDATE_INT);
        $limit = max(1, min(100, $limit === false ? 50 : $limit));
        $statement = $pdo->prepare(
            "SELECT proposals.id, COALESCE(proposals.community_role, 'Anónimo') AS community_role, proposals.proposal_text AS proposal,
                    DATE_FORMAT(COALESCE(proposals.published_at, proposals.created_at), '%Y-%m-%dT%H:%i:%sZ') AS published_at,
                    (SELECT COUNT(*) FROM community_proposal_supports AS supports
                     WHERE supports.proposal_id = proposals.id) AS support_count
             FROM community_proposals AS proposals
             WHERE proposals.status = 'approved'
             ORDER BY proposals.published_at DESC, proposals.id DESC
             LIMIT :limit"
        );
        $statement->bindValue(':limit', $limit, PDO::PARAM_INT);
        $statement->execute();
        respond(200, ['ok' => true, 'proposals' => $statement->fetchAll()]);
    }

    $input = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($input)) {
        respond(400, ['ok' => false, 'message' => 'Solicitud inválida.']);
    }

    // Bots que completan el campo trampa reciben una respuesta neutra y no se almacenan.
    $honeypot = $input['website'] ?? '';
    if (!is_string($honeypot)) {
        respond(400, ['ok' => false, 'message' => 'Solicitud inválida.']);
    }
    if (trim($honeypot) !== '') {
        respond(201, ['ok' => true, 'status' => 'pending']);
    }

    if (($input['publishConsent'] ?? false) !== true) {
        respond(400, ['ok' => false, 'message' => 'Debes aceptar la revisión y posible publicación de la propuesta.']);
    }

    if (!is_string($input['proposal'] ?? null)) {
        respond(400, ['ok' => false, 'message' => 'Escribe una propuesta válida.']);
    }
    $proposal = trim($input['proposal']);
    $proposal = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $proposal);
    if (!is_string($proposal) || preg_match('//u', $proposal) !== 1) {
        respond(400, ['ok' => false, 'message' => 'La propuesta debe usar texto válido.']);
    }
    $characterCount = function_exists('mb_strlen') ? mb_strlen($proposal, 'UTF-8') : preg_match_all('/./us', $proposal);
    if ($characterCount === false || $characterCount < 10 || $characterCount > 800) {
        respond(400, ['ok' => false, 'message' => 'Escribe una propuesta de entre 10 y 800 caracteres.']);
    }

    $author = trim((string)($input['author'] ?? $input['community_role'] ?? ''));
    $communityRole = $author !== '' ? mb_substr($author, 0, 60, 'UTF-8') : 'Anónimo';

    $profanityRegex = '/\b(chinga[rdonasm]?|chingue[sn]?|chingad[oa]s?|chingader[as]?|chingon(a|es|as)?|pendej[oa]s?|pendejad[as]?|put[oa]s?|putaz[oa]s?|putamadre|verg[as]|vergaz[oa]s?|verguiz[as]?|mierd[as]?|culer[oa]s?|cul[oa]s?|cabron(a|es|as)?|cabronad[as]?|estupid[oa]s?|idiot(a|as|o|os)?|imbecil(es)?|tarad[oa]s?|pinch[es]?|mamon(a|es|as)?|mamad[as]?|maricon(es)?|puñet[as]?|perr[as]?|zorr[as]?)\b/i';
    if (preg_match($profanityRegex, $proposal) || preg_match($profanityRegex, $communityRole)) {
        respond(400, ['ok' => false, 'message' => 'Tu propuesta contiene palabras inapropiadas. Por favor mantén un lenguaje respetuoso y constructivo para la comunidad.']);
    }

    $rateSecret = (string) ($config['proposal_rate_secret'] ?? '');
    if (strlen($rateSecret) < 32 || strpos($rateSecret, 'REEMPLAZA_') === 0) {
        respond(503, ['ok' => false, 'message' => 'Completa la clave anti-spam en la configuración del sitio.']);
    }
    $remoteAddress = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    if ($remoteAddress === '') {
        respond(400, ['ok' => false, 'message' => 'No pudimos validar esta solicitud.']);
    }
    $ipFingerprint = hash_hmac('sha256', $remoteAddress, $rateSecret);

    $pdo->beginTransaction();
    $cleanup = $pdo->prepare('DELETE FROM community_proposal_rate_limits WHERE last_submission_at < UTC_TIMESTAMP() - INTERVAL 24 HOUR');
    $cleanup->execute();

    $seed = $pdo->prepare(
        "INSERT IGNORE INTO community_proposal_rate_limits (ip_fingerprint, last_submission_at)
         VALUES (:ip_fingerprint, '2000-01-01 00:00:00')"
    );
    $seed->execute(['ip_fingerprint' => $ipFingerprint]);

    $check = $pdo->prepare(
        'SELECT last_submission_at >= UTC_TIMESTAMP() - INTERVAL 5 MINUTE
         FROM community_proposal_rate_limits WHERE ip_fingerprint = :ip_fingerprint FOR UPDATE'
    );
    $check->execute(['ip_fingerprint' => $ipFingerprint]);
    if ((bool) $check->fetchColumn()) {
        $pdo->rollBack();
        respond(429, ['ok' => false, 'message' => 'Espera unos minutos antes de enviar otra propuesta.']);
    }

    $update = $pdo->prepare(
        'UPDATE community_proposal_rate_limits
         SET last_submission_at = UTC_TIMESTAMP() WHERE ip_fingerprint = :ip_fingerprint'
    );
    $update->execute(['ip_fingerprint' => $ipFingerprint]);

    $insert = $pdo->prepare(
        "INSERT INTO community_proposals (community_role, proposal_text, status, published_at)
         VALUES (:community_role, :proposal_text, 'approved', UTC_TIMESTAMP())"
    );
    $insert->execute([
        'community_role' => $communityRole,
        'proposal_text' => $proposal,
    ]);
    $pdo->commit();

    respond(201, ['ok' => true, 'status' => 'approved', 'message' => '¡Gracias! Tu propuesta ha sido publicada con éxito.']);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[community-proposals] ' . $error->getMessage());
    respond(500, ['ok' => false, 'message' => 'No se pudo guardar o cargar la propuesta en este momento.']);
}
