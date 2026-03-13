<?php
// api/auth.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/jwt.php';
require_once __DIR__ . '/../includes/helpers.php';

function login() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_response(['error' => 'Método no permitido'], 405);
    }

    $input = get_json_input();
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';

    if (empty($email) || empty($password)) {
        json_response(['error' => 'Email y contraseña son requeridos'], 400);
    }

    try {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("SELECT id, nombre, email, password, rol FROM users WHERE email = :email LIMIT 1");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            $token = generate_jwt($user['id'], $user['rol']);
            json_response([
                'token' => $token,
                'user' => [
                    'id' => $user['id'],
                    'nombre' => $user['nombre'],
                    'email' => $user['email'],
                    'rol' => $user['rol']
                ]
            ]);
        } else {
            json_response(['error' => 'Credenciales inválidas'], 401);
        }
    } catch (\PDOException $e) {
        json_response(['error' => 'Error de base de datos'], 500);
    }
}

// Punto de entrada en auth.php
$uri = $_SERVER['REQUEST_URI'];
if (strpos($uri, '/api/login') !== false) {
    login();
} else {
    json_response(['error' => 'Endpoint no encontrado en auth'], 404);
}
?>