<?php
// api/scripts.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/jwt.php';
require_once __DIR__ . '/../includes/auth_middleware.php';
require_once __DIR__ . '/../includes/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
$decoded = auth_middleware(['admin', 'director', 'asesor']); // Todos necesitan leer scripts, solo admin/dir escribir

try {
    $pdo = getDBConnection();

    if ($method === 'GET') {
        $campaign_id = $_GET['campaign_id'] ?? null;
        if (!$campaign_id) {
            json_response(['error' => 'ID de campaña requerido'], 400);
        }

        $stmt = $pdo->prepare("SELECT id, campaign_id, contenido, creado FROM scripts WHERE campaign_id = :campaign_id ORDER BY id DESC LIMIT 1");
        $stmt->execute(['campaign_id' => $campaign_id]);
        $script = $stmt->fetch();

        if ($script) {
            json_response($script);
        } else {
            json_response(['mensaje' => 'No hay script para esta campaña', 'contenido' => '']);
        }
    }
    elseif ($method === 'POST') {
        if (!in_array($decoded['rol'], ['admin', 'director'])) {
            json_response(['error' => 'Permiso denegado para crear scripts'], 403);
        }

        $input = get_json_input();
        $campaign_id = $input['campaign_id'] ?? null;
        $contenido = trim($input['contenido'] ?? '');

        if (empty($campaign_id) || empty($contenido)) {
            json_response(['error' => 'Campaña y contenido son requeridos'], 400);
        }

        // Revisar si ya existe
        $stmt_check = $pdo->prepare("SELECT id FROM scripts WHERE campaign_id = :campaign_id");
        $stmt_check->execute(['campaign_id' => $campaign_id]);
        $exist = $stmt_check->fetch();

        if ($exist) {
            $stmt = $pdo->prepare("UPDATE scripts SET contenido = :contenido WHERE id = :id");
            $stmt->execute(['contenido' => $contenido, 'id' => $exist['id']]);
            json_response(['mensaje' => 'Script actualizado exitosamente']);
        } else {
            $stmt = $pdo->prepare("INSERT INTO scripts (campaign_id, contenido) VALUES (:campaign_id, :contenido)");
            $stmt->execute([
                'campaign_id' => $campaign_id,
                'contenido' => $contenido
            ]);
            json_response(['mensaje' => 'Script creado exitosamente', 'id' => $pdo->lastInsertId()], 201);
        }
    } else {
        json_response(['error' => 'Método no soportado'], 405);
    }
} catch (\PDOException $e) {
    json_response(['error' => 'Error de base de datos'], 500);
}
?>