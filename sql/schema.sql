CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'director', 'asesor') NOT NULL,
    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(50) UNIQUE NOT NULL,
    valor TEXT
);

CREATE TABLE IF NOT EXISTS campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    activa BOOLEAN DEFAULT TRUE,
    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scripts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT,
    contenido TEXT,
    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS prospects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    ciudad VARCHAR(100),
    email VARCHAR(100),
    otros TEXT,
    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prospect_id INT,
    user_id INT,
    fecha_inicio DATETIME,
    fecha_fin DATETIME,
    duracion INT,
    estado VARCHAR(50),
    comentarios TEXT,
    archivo_adjunto VARCHAR(255),
    grabacion_url VARCHAR(255),
    FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert admin user with password 'admin' (hashed)
INSERT INTO users (nombre, email, password, rol) VALUES
('Admin', 'admin@example.com', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'admin')
ON DUPLICATE KEY UPDATE id=id;

-- Insert default VoIP settings
INSERT IGNORE INTO settings (clave, valor) VALUES ('voip_server', '');
INSERT IGNORE INTO settings (clave, valor) VALUES ('voip_port', '');
INSERT IGNORE INTO settings (clave, valor) VALUES ('voip_transport', 'ws');
INSERT IGNORE INTO settings (clave, valor) VALUES ('voip_display_name', '');
INSERT IGNORE INTO settings (clave, valor) VALUES ('voip_username', '');
INSERT IGNORE INTO settings (clave, valor) VALUES ('voip_auth_user', '');
INSERT IGNORE INTO settings (clave, valor) VALUES ('voip_password', '');
INSERT IGNORE INTO settings (clave, valor) VALUES ('voip_domain', '');
