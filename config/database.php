<?php
// config/database.php

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'callcenter');

// Load JWT Secret from environment variable for security,
// fallback to a static default one for local dev so tokens persist across requests.
// Change this environment variable in production!
$jwt_secret = getenv('JWT_SECRET');
if (!$jwt_secret) {
    $jwt_secret = 'default_secret_key_for_dev_change_in_prod_123';
}
define('JWT_SECRET', $jwt_secret);

function getDBConnection() {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (\PDOException $e) {
        throw new \PDOException($e->getMessage(), (int)$e->getCode());
    }
}
?>