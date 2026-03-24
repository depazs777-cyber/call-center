<?php
// api/prospects.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/jwt.php';
require_once __DIR__ . '/../includes/auth_middleware.php';
require_once __DIR__ . '/../includes/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$decoded = auth_middleware(['admin', 'director', 'asesor']);

try {
    $pdo = getDBConnection();

    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            // CRM Detalle del prospecto
            $prospect_id = $_GET['id'];

            // Si es asesor, verificar que le pertenece
            if ($decoded['rol'] === 'asesor') {
                $stmt = $pdo->prepare("SELECT id FROM prospects WHERE id = :id AND assigned_to = :user_id");
                $stmt->execute(['id' => $prospect_id, 'user_id' => $decoded['user_id']]);
                if (!$stmt->fetch()) {
                    json_response(['error' => 'No tienes permiso para ver este prospecto'], 403);
                }
            }

            $stmt = $pdo->prepare("SELECT p.*, c.nombre as campaña_nombre, u.nombre as asignado_a_nombre
                                   FROM prospects p
                                   LEFT JOIN campaigns c ON p.campaign_id = c.id
                                   LEFT JOIN users u ON p.assigned_to = u.id
                                   WHERE p.id = :id");
            $stmt->execute(['id' => $prospect_id]);
            $prospect = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$prospect) {
                json_response(['error' => 'Prospecto no encontrado'], 404);
            }

            // Historial de llamadas
            $stmt = $pdo->prepare("SELECT c.*, u.nombre as asesor_nombre
                                   FROM calls c
                                   LEFT JOIN users u ON c.user_id = u.id
                                   WHERE c.prospect_id = :id
                                   ORDER BY c.fecha_inicio DESC");
            $stmt->execute(['id' => $prospect_id]);
            $prospect['historial'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            json_response($prospect);

        } else {
            // Listar prospectos
            $campaign_id = $_GET['campaign_id'] ?? null;
            $assigned_to = $_GET['assigned_to'] ?? null;
            $search = $_GET['search'] ?? null;
            $status = $_GET['status'] ?? null;

            $sql = "SELECT p.id, p.nombre, p.telefono, p.ciudad, p.email, p.otros, p.assigned_to, p.notas_internas, c.nombre as campaña_nombre, p.campaign_id, u.nombre as asignado_a_nombre,
                           (SELECT estado FROM calls WHERE prospect_id = p.id ORDER BY fecha_inicio DESC LIMIT 1) as ultimo_estado
                    FROM prospects p
                    JOIN campaigns c ON p.campaign_id = c.id
                    LEFT JOIN users u ON p.assigned_to = u.id
                    WHERE c.activa = 1";
            $params = [];

            if ($decoded['rol'] === 'asesor') {
                $sql .= " AND p.assigned_to = :user_id";
                $params['user_id'] = $decoded['user_id'];
            } else if ($assigned_to) {
                if ($assigned_to === 'unassigned') {
                    $sql .= " AND p.assigned_to IS NULL";
                } else {
                    $sql .= " AND p.assigned_to = :assigned_to";
                    $params['assigned_to'] = $assigned_to;
                }
            }

            if ($campaign_id) {
                $sql .= " AND p.campaign_id = :campaign_id";
                $params['campaign_id'] = $campaign_id;
            }

            if ($search) {
                $sql .= " AND (p.nombre LIKE :search OR p.telefono LIKE :search)";
                $params['search'] = "%$search%";
            }

            if ($status) {
                $sql .= " AND (SELECT estado FROM calls WHERE prospect_id = p.id ORDER BY fecha_inicio DESC LIMIT 1) = :status";
                $params['status'] = $status;
            }

            $sql .= " ORDER BY p.id DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $prospects = $stmt->fetchAll();

            json_response($prospects);
        }
    }
    elseif ($method === 'POST') {
        if (!in_array($decoded['rol'], ['admin', 'director'])) {
            json_response(['error' => 'Permiso denegado para subir prospectos'], 403);
        }

        if (strpos($uri, 'upload-csv') !== false) {
            if (!isset($_FILES['csv']) || $_FILES['csv']['error'] !== UPLOAD_ERR_OK) {
                json_response(['error' => 'Archivo CSV no válido o no enviado'], 400);
            }

            $campaign_id = $_POST['campaign_id'] ?? null;
            if (!$campaign_id) {
                json_response(['error' => 'ID de campaña requerido'], 400);
            }

            $assigned_to = $_POST['assigned_to'] ?? null;
            if ($assigned_to === '') {
                $assigned_to = null;
            }

            $csv_file = $_FILES['csv']['tmp_name'];
            $handle = fopen($csv_file, "r");

            if ($handle !== FALSE) {
                $header = fgetcsv($handle, 1000, ",");
                if (!$header) {
                    fclose($handle);
                    json_response(['error' => 'CSV vacío o mal formado'], 400);
                }

                // Normalizar encabezados (quitar espacios, minúsculas)
                $header_map = [];
                foreach ($header as $idx => $col) {
                    $header_map[strtolower(trim($col))] = $idx;
                }

                if (!isset($header_map['nombre']) || !isset($header_map['telefono'])) {
                    fclose($handle);
                    json_response(['error' => 'CSV debe contener columnas "nombre" y "telefono"'], 400);
                }

                $inserted = 0;
                $pdo->beginTransaction();

                $stmt = $pdo->prepare("INSERT INTO prospects (campaign_id, nombre, telefono, ciudad, email, otros, assigned_to) VALUES (:campaign_id, :nombre, :telefono, :ciudad, :email, :otros, :assigned_to)");

                while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                    $nombre = $data[$header_map['nombre']] ?? '';
                    $telefono = $data[$header_map['telefono']] ?? '';
                    $ciudad = isset($header_map['ciudad']) ? ($data[$header_map['ciudad']] ?? '') : '';
                    $email = isset($header_map['email']) ? ($data[$header_map['email']] ?? '') : '';

                    // Juntar otros campos
                    $otros = [];
                    foreach ($data as $idx => $val) {
                        if (!in_array($idx, $header_map)) {
                            $otros[] = $val;
                        }
                    }

                    if (!empty($nombre) && !empty($telefono)) {
                        $stmt->execute([
                            'campaign_id' => $campaign_id,
                            'nombre' => $nombre,
                            'telefono' => $telefono,
                            'ciudad' => $ciudad,
                            'email' => $email,
                            'otros' => json_encode($otros),
                            'assigned_to' => $assigned_to
                        ]);
                        $inserted++;
                    }
                }
                $pdo->commit();
                fclose($handle);

                json_response(['mensaje' => "Archivo procesado", 'registros_insertados' => $inserted]);
            } else {
                json_response(['error' => 'No se pudo leer el archivo CSV'], 500);
            }
        } elseif (strpos($uri, 'assign') !== false) {
            // Asignación de prospectos (masiva o individual)
            $input = json_decode(file_get_contents('php://input'), true);
            $prospect_ids = $input['prospect_ids'] ?? [];
            $assigned_to = $input['assigned_to'] ?? null;

            if (empty($prospect_ids)) {
                json_response(['error' => 'Se requieren IDs de prospectos'], 400);
            }

            if ($assigned_to === '') $assigned_to = null;

            $inQuery = implode(',', array_fill(0, count($prospect_ids), '?'));
            $sql = "UPDATE prospects SET assigned_to = ? WHERE id IN ($inQuery)";
            $stmt = $pdo->prepare($sql);

            $params = array_merge([$assigned_to], $prospect_ids);
            $stmt->execute($params);

            json_response(['mensaje' => 'Asignación actualizada', 'registros_actualizados' => $stmt->rowCount()]);

        } else {
            json_response(['error' => 'Ruta POST no soportada'], 404);
        }
    } elseif ($method === 'PUT') {
        // Actualizar notas internas del prospecto
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? null;
        $notas_internas = $input['notas_internas'] ?? null;

        if (!$id) {
            json_response(['error' => 'ID de prospecto requerido'], 400);
        }

        // Si es asesor, verificar que le pertenece
        if ($decoded['rol'] === 'asesor') {
            $stmt = $pdo->prepare("SELECT id FROM prospects WHERE id = :id AND assigned_to = :user_id");
            $stmt->execute(['id' => $id, 'user_id' => $decoded['user_id']]);
            if (!$stmt->fetch()) {
                json_response(['error' => 'No tienes permiso para editar este prospecto'], 403);
            }
        }

        $stmt = $pdo->prepare("UPDATE prospects SET notas_internas = :notas_internas WHERE id = :id");
        $stmt->execute(['notas_internas' => $notas_internas, 'id' => $id]);

        json_response(['mensaje' => 'Notas internas actualizadas']);
    } else {
        json_response(['error' => 'Método no soportado'], 405);
    }
} catch (\PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_response(['error' => 'Error de base de datos: ' . $e->getMessage()], 500);
}
?>