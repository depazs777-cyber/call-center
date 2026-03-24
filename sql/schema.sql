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
    assigned_to INT DEFAULT NULL,
    notas_internas TEXT,
    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prospect_id INT,
    user_id INT,
    fecha_inicio DATETIME,
    fecha_fin DATETIME,
    duracion INT,
    estado VARCHAR(50),
    medio_contacto VARCHAR(50) DEFAULT NULL,
    comentarios TEXT,
    archivo_adjunto VARCHAR(255),
    grabacion_url VARCHAR(255),
    FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- MIGRATION STATEMENTS (to run on an existing DB, not needed for fresh install but good practice)
-- ALTER TABLE prospects ADD COLUMN assigned_to INT DEFAULT NULL;
-- ALTER TABLE prospects ADD CONSTRAINT fk_prospect_user FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;
-- ALTER TABLE prospects ADD COLUMN notas_internas TEXT;
-- ALTER TABLE calls ADD COLUMN medio_contacto VARCHAR(50) DEFAULT NULL;


-- Insert admin user with password 'admin' (hashed)
INSERT INTO users (nombre, email, password, rol) VALUES
('Admin', 'admin@example.com', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'admin')
ON DUPLICATE KEY UPDATE id=id;

-- Insert default VoIP settings
INSERT IGNORE INTO settings (clave, valor) VALUES ('voip_server', 'srv2.recargavoip.com');
INSERT IGNORE INTO settings (clave, valor) VALUES ('voip_port', '8080');
INSERT IGNORE INTO settings (clave, valor) VALUES ('voip_transport', 'wss');
INSERT IGNORE INTO settings (clave, valor) VALUES ('voip_display_name', 'SENDEROS2');
INSERT IGNORE INTO settings (clave, valor) VALUES ('voip_username', 'SENDEROS2');
INSERT IGNORE INTO settings (clave, valor) VALUES ('voip_auth_user', 'SENDEROS2');
INSERT IGNORE INTO settings (clave, valor) VALUES ('voip_password', '');
INSERT IGNORE INTO settings (clave, valor) VALUES ('voip_domain', 'srv2.recargavoip.com');

-- Insert default user accounts requested by user (password '123456', hashed)
-- Password hash generated for '123456' is '$2y$10$wzN22B.aI3x9m.s9L1O1.OhT.t0lD9U2NlF5c.XwA5.2O1dO2b.F.'
INSERT IGNORE INTO users (nombre, email, password, rol) VALUES
('Caicedonia', 'caicedonia@senderosdepaz.com', '$2y$10$wzN22B.aI3x9m.s9L1O1.OhT.t0lD9U2NlF5c.XwA5.2O1dO2b.F.', 'asesor'),
('Direccion Comercial', 'direccioncomercial@senderosdepaz.com', '$2y$10$wzN22B.aI3x9m.s9L1O1.OhT.t0lD9U2NlF5c.XwA5.2O1dO2b.F.', 'director'),
('Obando', 'obando@senderosdepaz.com', '$2y$10$wzN22B.aI3x9m.s9L1O1.OhT.t0lD9U2NlF5c.XwA5.2O1dO2b.F.', 'asesor'),
('Ibague', 'ibague@senderosdepaz.com', '$2y$10$wzN22B.aI3x9m.s9L1O1.OhT.t0lD9U2NlF5c.XwA5.2O1dO2b.F.', 'asesor'),
('Alcala', 'alcala@senderosdepaz.com', '$2y$10$wzN22B.aI3x9m.s9L1O1.OhT.t0lD9U2NlF5c.XwA5.2O1dO2b.F.', 'asesor'),
('Empresarial Ibague', 'empresarialibague@senderosdepaz.com', '$2y$10$wzN22B.aI3x9m.s9L1O1.OhT.t0lD9U2NlF5c.XwA5.2O1dO2b.F.', 'asesor'),
('Comercial', 'comercial@senderosdepaz.com', '$2y$10$wzN22B.aI3x9m.s9L1O1.OhT.t0lD9U2NlF5c.XwA5.2O1dO2b.F.', 'asesor'),
('Cobrador Virtual Buga', 'cobradorvirtualbuga@senderosdepaz.com', '$2y$10$wzN22B.aI3x9m.s9L1O1.OhT.t0lD9U2NlF5c.XwA5.2O1dO2b.F.', 'asesor'),
('Mesa de Ayuda', 'mesadeayuda@senderosdepaz.com', '$2y$10$wzN22B.aI3x9m.s9L1O1.OhT.t0lD9U2NlF5c.XwA5.2O1dO2b.F.', 'admin'),
('Pereira', 'pereira@proteger.com', '$2y$10$wzN22B.aI3x9m.s9L1O1.OhT.t0lD9U2NlF5c.XwA5.2O1dO2b.F.', 'asesor');
