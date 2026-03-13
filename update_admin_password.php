<?php
// update_admin_password.php
require_once __DIR__ . '/config/database.php';

echo "<h1>Actualizador de Contraseña Admin</h1>";

try {
    $pdo = getDBConnection();

    // Nueva contraseña que vamos a establecer
    $nueva_password_plana = 'admin123';

    // Hasheamos la contraseña
    $password_hasheada = password_hash($nueva_password_plana, PASSWORD_DEFAULT);

    // Verificamos si el usuario admin@example.com existe
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = 'admin@example.com'");
    $stmt->execute();
    $admin_user = $stmt->fetch();

    if ($admin_user) {
        // El usuario existe, actualizamos la contraseña
        $update_stmt = $pdo->prepare("UPDATE users SET password = :password WHERE email = 'admin@example.com'");
        $update_stmt->execute(['password' => $password_hasheada]);

        echo "<p style='color: green;'><strong>Éxito:</strong> La contraseña para el usuario <b>admin@example.com</b> se ha actualizado correctamente.</p>";
        echo "<p>La nueva contraseña es: <b>" . htmlspecialchars($nueva_password_plana) . "</b></p>";
    } else {
        // El usuario no existe, lo creamos
        $insert_stmt = $pdo->prepare("INSERT INTO users (nombre, email, password, rol) VALUES ('Admin', 'admin@example.com', :password, 'admin')");
        $insert_stmt->execute(['password' => $password_hasheada]);

        echo "<p style='color: blue;'><strong>Aviso:</strong> El usuario admin no existía, pero ha sido creado.</p>";
        echo "<p>El usuario es: <b>admin@example.com</b></p>";
        echo "<p>La nueva contraseña es: <b>" . htmlspecialchars($nueva_password_plana) . "</b></p>";
    }

    echo "<hr><p style='color: red;'><strong>IMPORTANTE:</strong> Por motivos de seguridad, por favor elimina este archivo (<code>update_admin_password.php</code>) de tu servidor una vez que hayas iniciado sesión exitosamente.</p>";
    echo "<p><a href='index.php'>Ir al inicio de sesión</a></p>";

} catch (\PDOException $e) {
    echo "<p style='color: red;'><strong>Error de Base de Datos:</strong> " . $e->getMessage() . "</p>";
    echo "<p>Asegúrate de que la base de datos esté creada, las credenciales en <code>config/database.php</code> sean correctas, y hayas ejecutado <code>sql/schema.sql</code>.</p>";
}
?>