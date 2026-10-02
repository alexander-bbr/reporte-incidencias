# Reporte de Incidencias - Clínica UGA

Sistema web para la gestión de incidencias técnicas de la Clínica UGA. Permite registrar, dar seguimiento y resolver reportes relacionados con equipos informáticos, además de mantener un registro de auditoría de todas las operaciones críticas.

## 📖 Descripción

El **Sistema de Reporte de Incidencias** es un sistema web desarrollada para la Clínica UGA que permite al personal administrativo y técnico:

- Reportar incidencias relacionadas con equipos informáticos
- Gestionar el inventario de equipos de la clínica
- Mantener un catálogo de fallas comunes
- Registrar observaciones generales
- Administrar usuarios del sistema
- Auditar todas las operaciones críticas realizadas en el sistema

## ✨ Características

- 🔐 **Autenticación** con sesiones PHP y contraseñas encriptadas
- 👥 **Gestión de roles** con permisos granulares por módulo
- 📝 **CRUD completo** para Reportes, Equipos, Fallas, Observaciones y Usuarios
- 🔗 **Relaciones N:M** entre Reportes ↔ Equipos y Reportes ↔ Fallas
- 🔍 **Módulo de Auditoría** que registra automáticamente todas las operaciones
- 📊 **Dashboard** con contadores en tiempo real por módulo
- 🎨 **Interfaz responsive** con diseño limpio y consistente
- ⚡ **API REST** con respuestas JSON
- 🛡️ **Prepared statements** para prevenir inyección SQL

## 🛠 Tecnologías Utilizadas

### Frontend

- **HTML5** - Estructura semántica
- **CSS3** - Estilos modulares (global, módulos, formularios)
- **JavaScript (Vanilla)** - Lógica del cliente sin frameworks

### Backend

- **PHP 7.4+** - API REST
- **MySQL 5.7+** - Base de datos relacional

### Herramientas

- **XAMPP** - Servidor local (Apache + MySQL + PHP)

## ✅ Requisitos Previos

- **Servidor web** con soporte PHP (Apache, Nginx)
- **PHP 7.4** o superior
- **MySQL 5.7** o superior
- **Navegador moderno** (Chrome, Firefox, Edge, Safari)
- **XAMPP / WAMP / MAMP** (recomendado para desarrollo local)

## 🚀 Instalación

### 1. Descargar el proyecto

Coloca la carpeta `reporte-incidencias` dentro del directorio raíz de tu servidor:

- **XAMPP**: `C:\xampp\htdocs\reporte-incidencias`
- **WAMP**: `C:\wamp64\www\reporte-incidencias`
- **MAMP**: `/Applications/MAMP/htdocs/reporte-incidencias`

### 2. Crear la base de datos

Abre **phpMyAdmin** o tu cliente MySQL preferido e importa el script: `reporte-incidencias/backend/db/schema.sql`

### 3. Edita `reporte-incidencias/backend/config.php` con tus credenciales los siguientes valores

```PHP
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'reporte_incidencias');
```

### 4. Crea usuarios de prueba importando el script `reporte-incidencias/backend/db/operaciones/initial_data.sql`

### 5. Abre el navegador y visita

[http://localhost/reporte-incidencias/](http://localhost/reporte-incidencias/)

Serás redirigido automáticamente al login. Donde deberás ingresar los datos de un usuario para acceder al sistema de Reporte de Incidencias.
