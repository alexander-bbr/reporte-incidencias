/*
    Insertar usuarios de prueba
*/


-- Crear usuario del Rol Sistemas (contraseña: sistemas123)
INSERT INTO usuario (cedula_usuario, contrasena, nombre, apellido, telefono, rol) 
VALUES (
    '12345', 
    '$2y$10$7xt9oAsVNfJCSOJa644kduKp8O6mGYD6983cSFM.qm8H4FwZYVPB.', 
    'Gabriel', 
    'Briceño', 
    '0414-1234567', 
    'SISTEMAS'
);

-- Crear usuario del Rol Coordinadora (contraseña: coordidora123)
INSERT INTO usuario (cedula_usuario, contrasena, nombre, apellido, telefono, rol) 
VALUES (
    '123456', 
    '$2y$10$dv3dVQhGg.Rz8buDS2Kmpe2C3pVelWMJK/s95x54vT3Yqgt7GUC7G', 
    'Laura', 
    'González', 
    '0412-1234567', 
    'COORDINADORA'
);

-- Crear usuario del Rol Admisionista (contraseña: admision123)
INSERT INTO usuario (cedula_usuario, contrasena, nombre, apellido, telefono, rol) 
VALUES (
    '1234567', 
    '$2y$10$GUjlBPzyolZ5fFdgAtOHV.rby.vBq/Q7Jt3b6AiOhq.FwZelGRJTm', 
    'María', 
    'Pérez', 
    '0416-1234567', 
    'ADMISIONISTA'
);