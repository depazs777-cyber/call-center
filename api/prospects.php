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
        // Listar prospectos
        $campaign_id = $_GET['campaign_id'] ?? null;

        $sql = "SELECT p.id, p.nombre, p.telefono, p.ciudad, p.email, p.otros, c.nombre as campaña_nombre, p.campaign_id
                FROM prospects p
                JOIN campaigns c ON p.campaign_id = c.id
                WHERE c.activa = 1";
        $params = [];

        if ($campaign_id) {
            $sql .= " AND p.campaign_id = :campaign_id";
            $params['campaign_id'] = $campaign_id;
        }

        $sql .= " ORDER BY p.id DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $prospects = $stmt->fetchAll();

        json_response($prospects);
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

                $stmt = $pdo->prepare("INSERT INTO prospects (campaign_id, nombre, telefono, ciudad, email, otros) VALUES (:campaign_id, :nombre, :telefono, :ciudad, :email, :otros)");

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
                            'otros' => json_encode($otros)
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
        } else {
            json_response(['error' => 'Ruta POST no soportada'], 404);
        }
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