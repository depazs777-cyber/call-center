<?php
// api/users.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/jwt.php';
require_once __DIR__ . '/../includes/auth_middleware.php';
require_once __DIR__ . '/../includes/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

// Solo admin y director pueden gestionar usuarios
$decoded = auth_middleware(['admin', 'director']);

try {
    $pdo = getDBConnection();

    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT id, nombre, email, rol, creado FROM users ORDER BY creado DESC");
        $users = $stmt->fetchAll();
        json_response($users);
    }
    elseif ($method === 'POST') {
        $input = get_json_input();
        $nombre = trim($input['nombre'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';
        $rol = trim($input['rol'] ?? '');

        if (empty($nombre) || empty($email) || empty($password) || empty($rol)) {
            json_response(['error' => 'Todos los campos son obligatorios'], 400);
        }

        if (!in_array($rol, ['admin', 'director', 'asesor'])) {
            json_response(['error' => 'Rol inválido'], 400);
        }

        $hashed_password = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $pdo->prepare("INSERT INTO users (nombre, email, password, rol) VALUES (:nombre, :email, :password, :rol)");
        $stmt->execute([
            'nombre' => $nombre,
            'email' => $email,
            'password' => $hashed_password,
            'rol' => $rol
        ]);

        json_response(['mensaje' => 'Usuario creado exitosamente', 'id' => $pdo->lastInsertId()], 201);
    }
    elseif ($method === 'PUT') {
        $input = get_json_input();
        $id = $input['id'] ?? null;
        $nombre = trim($input['nombre'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';
        $rol = trim($input['rol'] ?? '');

        if (!$id || empty($nombre) || empty($email) || empty($rol)) {
            json_response(['error' => 'ID, nombre, email y rol son obligatorios'], 400);
        }

        if (!in_array($rol, ['admin', 'director', 'asesor'])) {
            json_response(['error' => 'Rol inválido'], 400);
        }

        if (!empty($password)) {
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET nombre = :nombre, email = :email, password = :password, rol = :rol WHERE id = :id");
            $stmt->execute(['nombre' => $nombre, 'email' => $email, 'password' => $hashed_password, 'rol' => $rol, 'id' => $id]);
        } else {
            // Keep existing password
            $stmt = $pdo->prepare("UPDATE users SET nombre = :nombre, email = :email, rol = :rol WHERE id = :id");
            $stmt->execute(['nombre' => $nombre, 'email' => $email, 'rol' => $rol, 'id' => $id]);
        }

        json_response(['mensaje' => 'Usuario actualizado exitosamente']);
    }
    elseif ($method === 'DELETE') {
        if (!in_array('admin', [$decoded['rol']])) {
            json_response(['error' => 'Solo admin puede eliminar usuarios'], 403);
        }
        $id = $_GET['id'] ?? null;
        if (!$id) {
            json_response(['error' => 'ID de usuario requerido'], 400);
        }

        $stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
        $stmt->execute(['id' => $id]);
        json_response(['mensaje' => 'Usuario eliminado exitosamente']);
    } else {
        json_response(['error' => 'Método no soportado'], 405);
    }
} catch (\PDOException $e) {
    if ($e->getCode() == 23000) { // Integridad - ej. email duplicado
        json_response(['error' => 'El correo electrónico ya está en uso'], 400);
    }
    json_response(['error' => 'Error de base de datos'], 500);
}
?>