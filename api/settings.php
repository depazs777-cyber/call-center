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
        $stmt = $pdo->query("SELECT clave, valor FROM settings WHERE clave IN ('voip_server', 'voip_port', 'voip_user', 'voip_pass')");
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        json_response([
            'servidor' => $settings['voip_server'] ?? '',
            'puerto' => $settings['voip_port'] ?? '',
            'usuario' => $settings['voip_user'] ?? '',
            'contraseña' => $settings['voip_pass'] ?? ''
        ]);
    }
    elseif ($method === 'POST') {
        if (!in_array($decoded['rol'], ['admin', 'director'])) {
            json_response(['error' => 'Permiso denegado para editar configuración'], 403);
        }

        $input = get_json_input();
        $servidor = $input['servidor'] ?? '';
        $puerto = $input['puerto'] ?? '';
        $usuario = $input['usuario'] ?? '';
        $contraseña = $input['contraseña'] ?? '';

        $updates = [
            'voip_server' => $servidor,
            'voip_port' => $puerto,
            'voip_user' => $usuario,
            'voip_pass' => $contraseña
        ];

        $stmt = $pdo->prepare("UPDATE settings SET valor = :valor WHERE clave = :clave");
        $pdo->beginTransaction();
        foreach ($updates as $clave => $valor) {
            $stmt->execute(['valor' => $valor, 'clave' => $clave]);
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