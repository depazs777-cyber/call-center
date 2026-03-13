<?php
// api/campaigns.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/jwt.php';
require_once __DIR__ . '/../includes/auth_middleware.php';
require_once __DIR__ . '/../includes/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
$decoded = auth_middleware(['admin', 'director', 'asesor']); // Asesores necesitan ver campañas

try {
    $pdo = getDBConnection();

    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT id, nombre, fecha_inicio, fecha_fin, activa FROM campaigns WHERE activa = 1 ORDER BY id DESC");
        $campaigns = $stmt->fetchAll();
        json_response($campaigns);
    }
    elseif ($method === 'POST') {
        if (!in_array($decoded['rol'], ['admin', 'director'])) {
            json_response(['error' => 'No tienes permisos para crear campañas'], 403);
        }

        $input = get_json_input();
        $nombre = trim($input['nombre'] ?? '');
        $fecha_inicio = trim($input['fecha_inicio'] ?? date('Y-m-d'));
        $fecha_fin = trim($input['fecha_fin'] ?? '');

        if (empty($nombre)) {
            json_response(['error' => 'El nombre de la campaña es obligatorio'], 400);
        }

        $stmt = $pdo->prepare("INSERT INTO campaigns (nombre, fecha_inicio, fecha_fin) VALUES (:nombre, :fecha_inicio, :fecha_fin)");
        $stmt->execute([
            'nombre' => $nombre,
            'fecha_inicio' => $fecha_inicio ?: null,
            'fecha_fin' => $fecha_fin ?: null
        ]);

        json_response(['mensaje' => 'Campaña creada exitosamente', 'id' => $pdo->lastInsertId()], 201);
    } else {
        json_response(['error' => 'Método no soportado'], 405);
    }
} catch (\PDOException $e) {
    json_response(['error' => 'Error de base de datos: ' . $e->getMessage()], 500);
}
?>