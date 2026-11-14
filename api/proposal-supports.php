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

function readTokenHash($value): string
{
    if (!is_string($value) || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $value)) {
        respond(400, ['ok' => false, 'message' => 'Identificador de navegador inválido.']);
    }

    return hash('sha256', strtolower($value));
}

function readProposalId($value): int
{
    $id = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($id === false) {
        respond(400, ['ok' => false, 'message' => 'La propuesta seleccionada no es válida.']);
    }

    return (int) $id;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'POST') {
    header('Allow: POST');
    respond(405, ['ok' => false, 'message' => 'Método no permitido.']);
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$requestHost = strtolower(preg_replace('/:\\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
if ($origin !== '') {
    $originHost = strtolower((string) parse_url($origin, PHP_URL_HOST));
    if ($originHost === '' || $requestHost === '' || !hash_equals($requestHost, $originHost)) {
        respond(403, ['ok' => false, 'message' => 'Origen de solicitud no permitido.']);
    }
}

$input = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($input)) {
    respond(400, ['ok' => false, 'message' => 'Solicitud inválida.']);
}
$tokenHash = readTokenHash($input['token'] ?? null);

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
        respond(503, ['ok' => false, 'message' => 'Completa la configuración MySQL para activar los votos a propuestas.']);
    }
}
if (!array_key_exists('db_password', $config) || !is_string($config['db_password']) || strpos($config['db_password'], 'TU_') === 0) {
    respond(503, ['ok' => false, 'message' => 'Completa la configuración MySQL para activar los votos a propuestas.']);
}

try {
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_name']);
    $pdo = new PDO($dsn, $config['db_user'], $config['db_password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    $action = $input['action'] ?? '';
    if ($action === 'statuses') {
        $rawIds = $input['proposalIds'] ?? null;
        if (!is_array($rawIds) || count($rawIds) > 100) {
            respond(400, ['ok' => false, 'message' => 'La lista de propuestas no es válida.']);
        }
        $proposalIds = array_values(array_unique(array_map('readProposalId', $rawIds)));
        if (!$proposalIds) {
            respond(200, ['ok' => true, 'supported_ids' => []]);
        }

        $placeholders = implode(',', array_fill(0, count($proposalIds), '?'));
        $statement = $pdo->prepare(
            "SELECT supports.proposal_id
             FROM community_proposal_supports AS supports
             INNER JOIN community_proposals AS proposals ON proposals.id = supports.proposal_id
             WHERE supports.token_hash = ? AND proposals.status = 'approved'
               AND supports.proposal_id IN ($placeholders)"
        );
        $statement->execute(array_merge([$tokenHash], $proposalIds));
        $supportedIds = array_map('intval', array_column($statement->fetchAll(), 'proposal_id'));
        respond(200, ['ok' => true, 'supported_ids' => $supportedIds]);
    }

    if (!in_array($action, ['status', 'support', 'remove'], true)) {
        respond(400, ['ok' => false, 'message' => 'Acción de voto no reconocida.']);
    }

    $proposalId = readProposalId($input['proposalId'] ?? null);
    $checkProposal = $pdo->prepare("SELECT 1 FROM community_proposals WHERE id = :id AND status = 'approved' LIMIT 1");
    $checkProposal->execute(['id' => $proposalId]);
    if (!$checkProposal->fetchColumn()) {
        respond(404, ['ok' => false, 'message' => 'La propuesta ya no está disponible.']);
    }

    if ($action === 'support') {
        $insert = $pdo->prepare(
            'INSERT IGNORE INTO community_proposal_supports (proposal_id, token_hash)
             VALUES (:proposal_id, :token_hash)'
        );
        $insert->execute(['proposal_id' => $proposalId, 'token_hash' => $tokenHash]);
    } elseif ($action === 'remove') {
        $remove = $pdo->prepare(
            'DELETE FROM community_proposal_supports
             WHERE proposal_id = :proposal_id AND token_hash = :token_hash'
        );
        $remove->execute(['proposal_id' => $proposalId, 'token_hash' => $tokenHash]);
    }

    $state = $pdo->prepare(
        'SELECT EXISTS(SELECT 1 FROM community_proposal_supports
         WHERE proposal_id = :proposal_id AND token_hash = :token_hash) AS supported,
         (SELECT COUNT(*) FROM community_proposal_supports WHERE proposal_id = :count_proposal_id) AS total'
    );
    $state->execute([
        'proposal_id' => $proposalId,
        'token_hash' => $tokenHash,
        'count_proposal_id' => $proposalId,
    ]);
    $result = $state->fetch();
    respond(200, [
        'ok' => true,
        'proposal_id' => $proposalId,
        'supported' => (bool) $result['supported'],
        'total' => (int) $result['total'],
    ]);
} catch (Throwable $error) {
    error_log('[proposal-supports] ' . $error->getMessage());
    respond(500, ['ok' => false, 'message' => 'No se pudo guardar el voto a esta propuesta.']);
}
