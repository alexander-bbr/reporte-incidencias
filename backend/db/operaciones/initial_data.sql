/*
    Insertar usuarios principales en el sistema
*/


-- Crear usuario del tipo Sistemas (contraseña: admin123)
INSERT INTO usuario (cedula_usuario, contrasena, nombre, apellido, telefono, rol) 
VALUES (
    '30717851', 
    '$2a$12$CehgM00XbOU5wWbp50VoxeOQxsgHW0wJz3vW7/Xh64C0KSBHKZNJK', 
    'Miguel', 
    'Bethancourt', 
    '0412-1986816', 
    'SISTEMAS'
);

-- Crear usuario del tipo Coordinadora (contraseña: coordi123)
INSERT INTO usuario (cedula_usuario, contrasena, nombre, apellido, telefono, rol) 
VALUES (
    '11223344', 
    '$2y$10$LQm6ZqX9bJ6cH5Wp3RjJjO5P2p6L5X3uQjV9qL5X3uQjV9qL5X3u', 
    'Laura', 
    'González', 
    '0414-9876543', 
    'COORDINADORA'
);

-- Crear usuario del tipo Admisionista (contraseña: admision123)
INSERT INTO usuario (cedula_usuario, contrasena, nombre, apellido, telefono, rol) 
VALUES (
    '87654321', 
    '$2y$10$eWJ5HgJrVQ6a9Zx8uZuqQ.f1p5NCXhH.9QJk4rH1h2S2Yq6a3mR2C', 
    'María', 
    'Pérez', 
    '0416-7654321', 
    'ADMISIONISTA'
);