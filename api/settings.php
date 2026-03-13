<?php
// api/settings.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/jwt.php';
require_once __DIR__ . '/../includes/auth_middleware.php';
require_once __DIR__ . '/../includes/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
$decoded = auth_middleware(['admin', 'director', 'asesor']); // Todos necesitan config VoIP para llamadas, admin/dir para editar

try {
    $pdo = getDBConnection();

    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT clave, valor FROM settings WHERE clave LIKE 'voip_%'");
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        json_response([
            'voip_server' => $settings['voip_server'] ?? '',
            'voip_port' => $settings['voip_port'] ?? '',
            'voip_transport' => $settings['voip_transport'] ?? 'ws',
            'voip_display_name' => $settings['voip_display_name'] ?? '',
            'voip_username' => $settings['voip_username'] ?? '',
            'voip_auth_user' => $settings['voip_auth_user'] ?? '',
            'voip_password' => $settings['voip_password'] ?? '',
            'voip_domain' => $settings['voip_domain'] ?? ''
        ]);
    }
    elseif ($method === 'POST') {
        if (!in_array($decoded['rol'], ['admin', 'director'])) {
            json_response(['error' => 'Permiso denegado para editar configuración'], 403);
        }

        $input = get_json_input();

        $updates = [
            'voip_server' => $input['voip_server'] ?? '',
            'voip_port' => $input['voip_port'] ?? '',
            'voip_transport' => $input['voip_transport'] ?? 'ws',
            'voip_display_name' => $input['voip_display_name'] ?? '',
            'voip_username' => $input['voip_username'] ?? '',
            'voip_auth_user' => $input['voip_auth_user'] ?? '',
            'voip_password' => $input['voip_password'] ?? '',
            'voip_domain' => $input['voip_domain'] ?? ''
        ];

        $stmt_update = $pdo->prepare("UPDATE settings SET valor = :valor WHERE clave = :clave");
        $stmt_insert = $pdo->prepare("INSERT INTO settings (clave, valor) VALUES (:clave, :valor)");

        $pdo->beginTransaction();
        foreach ($updates as $clave => $valor) {
            $stmt_update->execute(['valor' => $valor, 'clave' => $clave]);
            if ($stmt_update->rowCount() == 0) {
                // Si la clave no existía y no se actualizó, la insertamos
                try {
                    $stmt_insert->execute(['clave' => $clave, 'valor' => $valor]);
                } catch (\PDOException $e) {
                    // Ignore duplicate key errors if it was just identical value
                }
            }
        }
        $pdo->commit();

        json_response(['mensaje' => 'Configuración VoIP guardada exitosamente']);
    } else {
        json_response(['error' => 'Método no soportado'], 405);
    }
} catch (\PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_response(['error' => 'Error de base de datos'], 500);
}
?>