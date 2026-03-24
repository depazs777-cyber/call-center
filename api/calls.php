<?php
// api/calls.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/jwt.php';
require_once __DIR__ . '/../includes/auth_middleware.php';
require_once __DIR__ . '/../includes/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$decoded = auth_middleware(['admin', 'director', 'asesor']); // Todos pueden iniciar, finalizar, ver historial

try {
    $pdo = getDBConnection();

    if ($method === 'POST') {
        if (strpos($uri, 'start') !== false) {
            $input = get_json_input();
            $prospect_id = $input['prospect_id'] ?? null;

            if (empty($prospect_id)) {
                json_response(['error' => 'ID de prospecto es requerido'], 400);
            }

            // Iniciar llamada
            $stmt = $pdo->prepare("INSERT INTO calls (prospect_id, user_id, fecha_inicio, estado) VALUES (:prospect_id, :user_id, NOW(), 'en_curso')");
            $stmt->execute([
                'prospect_id' => $prospect_id,
                'user_id' => $decoded['user_id']
            ]);
            $call_id = $pdo->lastInsertId();

            json_response(['mensaje' => 'Llamada iniciada', 'call_id' => $call_id], 201);
        }
        elseif (strpos($uri, 'end') !== false) {
            $call_id = $_POST['call_id'] ?? null;
            $estado = $_POST['estado'] ?? null;
            $comentarios = $_POST['comentarios'] ?? null;
            $medio_contacto = $_POST['medio_contacto'] ?? null;

            if (empty($call_id) || empty($estado)) {
                json_response(['error' => 'Call ID y estado son obligatorios'], 400);
            }

            // Obtener datos de la llamada para verificar existencia y campaña (para guardar archivos)
            $stmt_info = $pdo->prepare("SELECT c.fecha_inicio, p.campaign_id FROM calls c LEFT JOIN prospects p ON c.prospect_id = p.id WHERE c.id = :call_id");
            $stmt_info->execute(['call_id' => $call_id]);
            $call_info = $stmt_info->fetch();

            if (!$call_info) {
                json_response(['error' => 'Llamada no encontrada'], 404);
            }

            // Guardar archivos si existen
            $campaign_dir = __DIR__ . '/../uploads/campaign_' . ($call_info['campaign_id'] ?? 'unknown');
            if (!file_exists($campaign_dir)) {
                mkdir($campaign_dir, 0777, true);
            }

            $adjunto_url = null;
            $grabacion_url = null;

            // Validaciones de seguridad y tamaño (10MB max)
            $max_size = 10 * 1024 * 1024;
            $allowed_attachment_exts = ['pdf', 'txt', 'jpg', 'jpeg', 'png', 'doc', 'docx'];

            // Mover archivos subidos (si hay)
            if (isset($_FILES['adjunto']) && $_FILES['adjunto']['error'] === UPLOAD_ERR_OK) {
                if ($_FILES['adjunto']['size'] > $max_size) {
                    json_response(['error' => 'El archivo adjunto es demasiado grande (máximo 10MB)'], 400);
                }

                $ext = strtolower(pathinfo($_FILES['adjunto']['name'], PATHINFO_EXTENSION));
                if (!in_array($ext, $allowed_attachment_exts)) {
                    json_response(['error' => 'Tipo de archivo adjunto no permitido'], 400);
                }

                $adjunto_name = 'adjunto_' . $call_id . '_' . time() . '.' . $ext;
                $adjunto_path = $campaign_dir . '/' . $adjunto_name;
                move_uploaded_file($_FILES['adjunto']['tmp_name'], $adjunto_path);
                $adjunto_url = 'uploads/campaign_' . ($call_info['campaign_id'] ?? 'unknown') . '/' . $adjunto_name;
            }

            if (isset($_FILES['grabacion']) && $_FILES['grabacion']['error'] === UPLOAD_ERR_OK) {
                if ($_FILES['grabacion']['size'] > $max_size) {
                    json_response(['error' => 'La grabación es demasiado grande (máximo 10MB)'], 400);
                }
                // Validar MIME type en lugar de solo extensión
                $mime = mime_content_type($_FILES['grabacion']['tmp_name']);
                if (strpos($mime, 'audio/') !== 0 && strpos($mime, 'video/webm') !== 0) {
                     json_response(['error' => 'Formato de grabación inválido'], 400);
                }

                $grabacion_name = 'grabacion_' . $call_id . '_' . time() . '.webm'; // Asumiendo que MediaRecorder graba en WebM
                $grabacion_path = $campaign_dir . '/' . $grabacion_name;
                move_uploaded_file($_FILES['grabacion']['tmp_name'], $grabacion_path);
                $grabacion_url = 'uploads/campaign_' . ($call_info['campaign_id'] ?? 'unknown') . '/' . $grabacion_name;
            }

            // Finalizar llamada
            $stmt = $pdo->prepare("UPDATE calls SET
                                    fecha_fin = NOW(),
                                    estado = :estado,
                                    comentarios = :comentarios,
                                    archivo_adjunto = :archivo_adjunto,
                                    grabacion_url = :grabacion_url,
                                    duracion = TIMESTAMPDIFF(SECOND, fecha_inicio, NOW()),
                                    medio_contacto = :medio_contacto
                                   WHERE id = :call_id");

            $stmt->execute([
                'estado' => $estado,
                'comentarios' => $comentarios,
                'archivo_adjunto' => $adjunto_url,
                'grabacion_url' => $grabacion_url,
                'medio_contacto' => $medio_contacto,
                'call_id' => $call_id
            ]);

            json_response(['mensaje' => 'Llamada finalizada correctamente']);
        } else {
            json_response(['error' => 'Ruta no encontrada para POST'], 404);
        }
    }
    elseif ($method === 'GET' && strpos($uri, 'history') !== false) {
        $sql = "SELECT c.id, p.nombre AS prospecto, p.telefono, u.nombre AS asesor, c.fecha_inicio, c.fecha_fin, c.duracion, c.estado, c.comentarios, c.archivo_adjunto, c.grabacion_url, c.medio_contacto, p.campaign_id
                FROM calls c
                LEFT JOIN prospects p ON c.prospect_id = p.id
                LEFT JOIN users u ON c.user_id = u.id";

        $params = [];
        $conds = [];

        // Si es asesor, solo ve sus llamadas
        if ($decoded['rol'] === 'asesor') {
            $conds[] = "c.user_id = :user_id";
            $params['user_id'] = $decoded['user_id'];
        }

        // Filtros opcionales
        $user_filter = $_GET['user_id'] ?? null;
        if ($user_filter && $decoded['rol'] !== 'asesor') {
            $conds[] = "c.user_id = :user_id_filter";
            $params['user_id_filter'] = $user_filter;
        }

        $campaign_filter = $_GET['campaign_id'] ?? null;
        if ($campaign_filter) {
            $conds[] = "p.campaign_id = :campaign_filter";
            $params['campaign_filter'] = $campaign_filter;
        }

        if (count($conds) > 0) {
            $sql .= " WHERE " . implode(" AND ", $conds);
        }

        $sql .= " ORDER BY c.fecha_inicio DESC LIMIT 100"; // Limitar historial en Fase 1

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $historial = $stmt->fetchAll();

        json_response($historial);
    } else {
        json_response(['error' => 'Método o ruta no soportado'], 405);
    }
} catch (\PDOException $e) {
    json_response(['error' => 'Error de base de datos: ' . $e->getMessage()], 500);
}
?>