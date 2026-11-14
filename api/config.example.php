<?php
declare(strict_types=1);

// Copia este archivo como config.php y reemplaza estos valores desde hPanel.
// Si el servidor permite variables de entorno, se leen primero; de lo contrario usa config.php.
// No publiques ni compartas config.php: contiene credenciales de MySQL.
return [
    'db_host' => getenv('DB_HOST') ?: 'localhost',
    'db_name' => getenv('DB_NAME') ?: 'bd-orgullochapingo',
    'db_user' => getenv('DB_USER') ?: 'us-orgullochapingo',
    'db_password' => getenv('DB_PASSWORD') ?: '',
    // Genera una clave secreta larga y aleatoria para las huellas temporales anti-spam.
    'proposal_rate_secret' => getenv('PROPOSAL_RATE_SECRET') ?: 'FB4ED249908D0DB30EC122C4AEC9C760A3776495FA30C87E4BEBE797D7FA4EA7',
];
