<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

$dataFile = __DIR__ . '/votes.json';
$baseVotes = 184;

if (file_exists($dataFile)) {
    $data = json_decode((string) file_get_contents($dataFile), true) ?: [];
} else {
    $data = [
        'baseCount' => $baseVotes,
        'extraVotes' => 0,
        'votedTokens' => []
    ];
}

if (!isset($data['baseCount'])) $data['baseCount'] = $baseVotes;
if (!isset($data['extraVotes'])) $data['extraVotes'] = 0;
if (!isset($data['votedTokens'])) $data['votedTokens'] = [];

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$input = [];
if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    if ($raw) {
        $input = json_decode($raw, true) ?: [];
    }
} else {
    $input = $_GET;
}

$token = $input['token'] ?? '';
$tokenHash = '';
if (is_string($token) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $token)) {
    $tokenHash = hash('sha256', strtolower($token));
}

$supported = false;
if ($tokenHash && in_array($tokenHash, $data['votedTokens'], true)) {
    $supported = true;
}

if ($method === 'POST') {
    $action = $input['action'] ?? 'vote';
    if ($action === 'vote' || $action === 'support') {
        if ($tokenHash) {
            if (!$supported) {
                $data['votedTokens'][] = $tokenHash;
                $supported = true;
            } else {
                $data['extraVotes']++;
            }
        } else {
            $data['extraVotes']++;
        }
        @file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }
}

$total = (int)$data['baseCount'] + (int)$data['extraVotes'] + count($data['votedTokens']);

echo json_encode([
    'ok' => true,
    'total' => $total,
    'supported' => $supported
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
