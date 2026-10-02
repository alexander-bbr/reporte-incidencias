CREATE DATABASE IF NOT EXISTS reporte_incidencias_ugita;
USE reporte_incidencias_ugita;

-- *Tablas Principales

CREATE TABLE usuario (
  cedula_usuario VARCHAR(15) PRIMARY KEY, -- *Se usa VARCHAR por la posibilidad de trabajar con cédulas de extranjeros
  contrasena VARCHAR(255),
  nombre VARCHAR(50),
  apellido VARCHAR(50),
  telefono VARCHAR(15),
  rol enum('COORDINADORA','ADMISIONISTA', 'SISTEMAS')
);

CREATE TABLE auditoria (
  id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
  cedula_usuario VARCHAR(15) NOT NULL,
  accion ENUM('CREAR', 'EDITAR', 'ELIMINAR') NOT NULL,
  tabla_afectada VARCHAR(50) NOT NULL,
  id_registro VARCHAR(50) NULL,
  descripcion VARCHAR(255) NULL,
  datos_anteriores TEXT NULL,
  datos_nuevos TEXT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (cedula_usuario) 
    REFERENCES usuario(cedula_usuario)
);

CREATE TABLE reporte (
  id_reporte INT AUTO_INCREMENT PRIMARY KEY,
  cedula_usuario VARCHAR(15) NOT NULL,
  titulo VARCHAR (100),
  descripcion TEXT,
  estado enum('PENDIENTE','EN REVISION', 'REVISADO'),
  prioridad enum('BAJA','MEDIA','ALTA'),
  solucion TEXT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reporte_usuario FOREIGN KEY (cedula_usuario) REFERENCES usuario (cedula_usuario)
);

CREATE TABLE equipo (
  id_equipo INT AUTO_INCREMENT PRIMARY KEY,
  cedula_usuario VARCHAR(15) NOT NULL,
  nombre VARCHAR (50),
  descripcion TEXT,
  tipo enum('COMPUTADORA','IMPRESORA','TELEFONO','OTRO'),
  estado enum('OPERATIVO','MANTENIMIENTO','INOPERATIVO'),
  CONSTRAINT fk_equipo_usuario FOREIGN KEY (cedula_usuario) REFERENCES usuario (cedula_usuario)
);

-- Esta tabla es solo para guardar ciertos mensajes que los usuarios dejan como solicitudes, avisos, etc. Por eso no se relaciona con reporte. Es solo para observaciones generales
CREATE TABLE observacion (
  id_observacion INT AUTO_INCREMENT PRIMARY KEY,
  cedula_usuario VARCHAR(15) NOT NULL,
  titulo VARCHAR (100),
  descripcion TEXT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_observacion_usuario FOREIGN KEY (cedula_usuario) REFERENCES usuario (cedula_usuario)
);

CREATE TABLE falla (
  id_falla INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR (100),
  descripcion TEXT
);

-- *Tablas para relaciones

-- Relación N:M entre reporte y equipo
CREATE TABLE reporte_equipo (
  id_reporte_equipo INT AUTO_INCREMENT PRIMARY KEY,
  id_reporte INT NOT NULL,
  id_equipo INT NOT NULL,
  CONSTRAINT fk_reporte_equipo_reporte FOREIGN KEY (id_reporte) REFERENCES reporte (id_reporte),
  CONSTRAINT fk_reporte_equipo_equipo FOREIGN KEY (id_equipo) REFERENCES equipo (id_equipo),
  CONSTRAINT uk_reporte_equipo_unique UNIQUE(id_reporte, id_equipo)
);

-- Relación N:M entre reporte y falla
CREATE TABLE reporte_falla (
  id_reporte_falla INT AUTO_INCREMENT PRIMARY KEY,
  id_reporte INT NOT NULL,
  id_falla INT NOT NULL,
  CONSTRAINT fk_reporte_falla_reporte FOREIGN KEY (id_reporte) REFERENCES reporte (id_reporte),
  CONSTRAINT fk_reporte_falla_falla FOREIGN KEY (id_falla) REFERENCES falla (id_falla),
  CONSTRAINT uk_reporte_falla_unique UNIQUE(id_reporte, id_falla)
);