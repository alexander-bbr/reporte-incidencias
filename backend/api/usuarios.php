<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar solicitudes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db/conexion.php';
require_once __DIR__ . '/../includes/funciones.php';

// Verificar autenticación
verificarSesion();

$method = $_SERVER['REQUEST_METHOD'];
$conn = conectarDB();

switch ($method) {
    case 'GET':
        if (isset($_GET['cedula'])) {
            // Obtener un usuario específico
            $cedula = $_GET['cedula'];
            $sql = "SELECT cedula_usuario, nombre, apellido, telefono, rol FROM usuario WHERE cedula_usuario = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("s", $cedula);
            $stmt->execute();
            $result = $stmt->get_result();
            $usuario = $result->fetch_assoc();
            
            if ($usuario) {
                respuestaJSON(true, 'Usuario encontrado', ['usuario' => $usuario]);
            } else {
                respuestaJSON(false, 'Usuario no encontrado');
            }
        } else {
            // Obtener todos los usuarios
            $sql = "SELECT cedula_usuario, nombre, apellido, telefono, rol FROM usuario ORDER BY nombre";
            $result = $conn->query($sql);
            $usuarios = $result->fetch_all(MYSQLI_ASSOC);
            
            respuestaJSON(true, 'Usuarios obtenidos correctamente', ['usuarios' => $usuarios]);
        }
        break;
        
    case 'POST':
        // Crear usuario
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validar campos requeridos
        $camposRequeridos = ['cedula', 'nombre', 'apellido', 'telefono', 'rol', 'contrasena'];
        foreach ($camposRequeridos as $campo) {
            if (!isset($data[$campo]) || empty($data[$campo])) {
                respuestaJSON(false, "El campo '$campo' es requerido");
            }
        }
        
        $cedula = sanitizar($data['cedula']);
        $nombre = sanitizar($data['nombre']);
        $apellido = sanitizar($data['apellido']);
        $telefono = sanitizar($data['telefono']);
        $rol = sanitizar($data['rol']);
        $contrasena = password_hash($data['contrasena'], PASSWORD_DEFAULT);
        
        // Verificar si la cédula ya existe
        $sql = "SELECT cedula_usuario FROM usuario WHERE cedula_usuario = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $cedula);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            cerrarDB($conn);
            respuestaJSON(false, 'La cédula ya está registrada');
        }
        
        // Insertar usuario
        $sql = "INSERT INTO usuario (cedula_usuario, contrasena, nombre, apellido, telefono, rol) 
                VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssssss", $cedula, $contrasena, $nombre, $apellido, $telefono, $rol);
        
        if ($stmt->execute()) {
            cerrarDB($conn);
            respuestaJSON(true, 'Usuario creado correctamente', [
                'usuario' => [
                    'cedula_usuario' => $cedula,
                    'nombre' => $nombre,
                    'apellido' => $apellido,
                    'telefono' => $telefono,
                    'rol' => $rol
                ]
            ]);
        } else {
            cerrarDB($conn);
            respuestaJSON(false, 'Error al crear el usuario: ' . $stmt->error);
        }
        break;
        
    case 'PUT':
        // Actualizar usuario
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['cedula']) || empty($data['cedula'])) {
            respuestaJSON(false, 'La cédula es requerida');
        }
        
        $cedula = sanitizar($data['cedula']);
        $nombre = sanitizar($data['nombre'] ?? '');
        $apellido = sanitizar($data['apellido'] ?? '');
        $telefono = sanitizar($data['telefono'] ?? '');
        $rol = sanitizar($data['rol'] ?? '');
        
        // Construir la consulta dinámicamente
        $sql = "UPDATE usuario SET ";
        $params = [];
        $types = "";
        
        if (!empty($nombre)) {
            $sql .= "nombre = ?, ";
            $params[] = $nombre;
            $types .= "s";
        }
        
        if (!empty($apellido)) {
            $sql .= "apellido = ?, ";
            $params[] = $apellido;
            $types .= "s";
        }
        
        if (!empty($telefono)) {
            $sql .= "telefono = ?, ";
            $params[] = $telefono;
            $types .= "s";
        }
        
        if (!empty($rol)) {
            $sql .= "rol = ?, ";
            $params[] = $rol;
            $types .= "s";
        }
        
        // Si viene contraseña, actualizarla
        if (isset($data['contrasena']) && !empty($data['contrasena'])) {
            $contrasena = password_hash($data['contrasena'], PASSWORD_DEFAULT);
            $sql .= "contrasena = ?, ";
            $params[] = $contrasena;
            $types .= "s";
        }
        
        // Eliminar la última coma y espacio
        $sql = rtrim($sql, ", ");
        
        $sql .= " WHERE cedula_usuario = ?";
        $params[] = $cedula;
        $types .= "s";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        
        if ($stmt->execute()) {
            cerrarDB($conn);
            respuestaJSON(true, 'Usuario actualizado correctamente');
        } else {
            cerrarDB($conn);
            respuestaJSON(false, 'Error al actualizar el usuario: ' . $stmt->error);
        }
        break;
        
    case 'DELETE':
        // Eliminar usuario
        if (!isset($_GET['cedula']) || empty($_GET['cedula'])) {
            respuestaJSON(false, 'La cédula es requerida');
        }
        
        $cedula = $_GET['cedula'];
        
        // Verificar que no se esté eliminando a sí mismo
        $usuarioActual = obtenerUsuarioActual();
        if ($usuarioActual['cedula_usuario'] === $cedula) {
            cerrarDB($conn);
            respuestaJSON(false, 'No puedes eliminar tu propio usuario');
        }
        
        // Verificar si el usuario existe
        $sql = "SELECT cedula_usuario FROM usuario WHERE cedula_usuario = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $cedula);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            cerrarDB($conn);
            respuestaJSON(false, 'Usuario no encontrado');
        }
        
        // Eliminar usuario
        $sql = "DELETE FROM usuario WHERE cedula_usuario = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $cedula);
        
        if ($stmt->execute()) {
            cerrarDB($conn);
            respuestaJSON(true, 'Usuario eliminado correctamente');
        } else {
            cerrarDB($conn);
            respuestaJSON(false, 'Error al eliminar el usuario: ' . $stmt->error);
        }
        break;
        
    default:
        respuestaJSON(false, 'Método no permitido');
}

$conn->close();
?>