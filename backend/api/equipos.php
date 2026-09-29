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
        if (isset($_GET['id'])) {
            // Obtener un equipo específico
            $id = intval($_GET['id']);
            $sql = "SELECT 
                        e.id_equipo,
                        e.cedula_usuario,
                        e.nombre AS nombre_equipo,
                        e.descripcion,
                        e.tipo,
                        e.estado,
                        u.nombre AS nombre_usuario,
                        u.apellido AS apellido_usuario
                    FROM equipo e
                    INNER JOIN usuario u ON e.cedula_usuario = u.cedula_usuario
                    WHERE e.id_equipo = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $equipo = $result->fetch_assoc();
            
            if ($equipo) {
                respuestaJSON(true, 'Equipo encontrado', ['equipo' => $equipo]);
            } else {
                respuestaJSON(false, 'Equipo no encontrado');
            }
        } else {
            // Obtener todos los equipos
            $sql = "SELECT 
                        e.id_equipo,
                        e.cedula_usuario,
                        e.nombre AS nombre_equipo,
                        e.descripcion,
                        e.tipo,
                        e.estado,
                        u.nombre AS nombre_usuario,
                        u.apellido AS apellido_usuario
                    FROM equipo e
                    INNER JOIN usuario u ON e.cedula_usuario = u.cedula_usuario
                    ORDER BY e.nombre";
            $result = $conn->query($sql);
            $equipos = $result->fetch_all(MYSQLI_ASSOC);
            
            respuestaJSON(true, 'Equipos obtenidos correctamente', ['equipos' => $equipos]);
        }
        break;
        
    case 'POST':
        // Crear equipo
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validar campos requeridos
        $camposRequeridos = ['nombre', 'tipo', 'estado'];
        foreach ($camposRequeridos as $campo) {
            if (!isset($data[$campo]) || empty($data[$campo])) {
                respuestaJSON(false, "El campo '$campo' es requerido");
            }
        }
        
        $cedula_usuario = obtenerUsuarioActual()['cedula_usuario'];
        $nombre = sanitizar($data['nombre']);
        $descripcion = isset($data['descripcion']) ? sanitizar($data['descripcion']) : '';
        $tipo = sanitizar($data['tipo']);
        $estado = sanitizar($data['estado']);
        
        // Validar tipo y estado
        $tiposValidos = ['COMPUTADORA', 'IMPRESORA', 'TELEFONO', 'OTRO'];
        $estadosValidos = ['OPERATIVO', 'MANTENIMIENTO', 'INOPERATIVO'];
        
        if (!in_array($tipo, $tiposValidos)) {
            respuestaJSON(false, 'Tipo de equipo no válido');
        }
        
        if (!in_array($estado, $estadosValidos)) {
            respuestaJSON(false, 'Estado de equipo no válido');
        }
        
        // Insertar equipo
        $sql = "INSERT INTO equipo (cedula_usuario, nombre, descripcion, tipo, estado) 
                VALUES (?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssss", $cedula_usuario, $nombre, $descripcion, $tipo, $estado);
        
        if ($stmt->execute()) {
            $id = $conn->insert_id;
            cerrarDB($conn);
            respuestaJSON(true, 'Equipo creado correctamente', [
                'id' => $id,
                'equipo' => [
                    'id_equipo' => $id,
                    'cedula_usuario' => $cedula_usuario,
                    'nombre' => $nombre,
                    'descripcion' => $descripcion,
                    'tipo' => $tipo,
                    'estado' => $estado
                ]
            ]);
        } else {
            cerrarDB($conn);
            respuestaJSON(false, 'Error al crear el equipo: ' . $stmt->error);
        }
        break;
        
    case 'PUT':
        // Actualizar equipo
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['id']) || empty($data['id'])) {
            respuestaJSON(false, 'El ID es requerido');
        }
        
        $id = intval($data['id']);
        $nombre = sanitizar($data['nombre'] ?? '');
        $descripcion = isset($data['descripcion']) ? sanitizar($data['descripcion']) : '';
        $tipo = sanitizar($data['tipo'] ?? '');
        $estado = sanitizar($data['estado'] ?? '');
        
        // Verificar que el equipo existe
        $sql = "SELECT cedula_usuario FROM equipo WHERE id_equipo = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $equipo = $result->fetch_assoc();
        
        if (!$equipo) {
            cerrarDB($conn);
            respuestaJSON(false, 'Equipo no encontrado');
        }
        
        // Validar tipo y estado si vienen
        if (!empty($tipo)) {
            $tiposValidos = ['COMPUTADORA', 'IMPRESORA', 'TELEFONO', 'OTRO'];
            if (!in_array($tipo, $tiposValidos)) {
                cerrarDB($conn);
                respuestaJSON(false, 'Tipo de equipo no válido');
            }
        }
        
        if (!empty($estado)) {
            $estadosValidos = ['OPERATIVO', 'MANTENIMIENTO', 'INOPERATIVO'];
            if (!in_array($estado, $estadosValidos)) {
                cerrarDB($conn);
                respuestaJSON(false, 'Estado de equipo no válido');
            }
        }
        
        // Construir la consulta dinámicamente
        $sql = "UPDATE equipo SET ";
        $params = [];
        $types = "";
        
        if (!empty($nombre)) {
            $sql .= "nombre = ?, ";
            $params[] = $nombre;
            $types .= "s";
        }
        
        if (!empty($descripcion)) {
            $sql .= "descripcion = ?, ";
            $params[] = $descripcion;
            $types .= "s";
        }
        
        if (!empty($tipo)) {
            $sql .= "tipo = ?, ";
            $params[] = $tipo;
            $types .= "s";
        }
        
        if (!empty($estado)) {
            $sql .= "estado = ?, ";
            $params[] = $estado;
            $types .= "s";
        }
        
        // Eliminar la última coma y espacio
        $sql = rtrim($sql, ", ");
        
        $sql .= " WHERE id_equipo = ?";
        $params[] = $id;
        $types .= "i";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        
        if ($stmt->execute()) {
            cerrarDB($conn);
            respuestaJSON(true, 'Equipo actualizado correctamente');
        } else {
            cerrarDB($conn);
            respuestaJSON(false, 'Error al actualizar el equipo: ' . $stmt->error);
        }
        break;
        
    case 'DELETE':
        // Eliminar equipo
        if (!isset($_GET['id']) || empty($_GET['id'])) {
            respuestaJSON(false, 'El ID es requerido');
        }
        
        $id = intval($_GET['id']);
        
        // Verificar que el equipo existe
        $sql = "SELECT id_equipo FROM equipo WHERE id_equipo = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            cerrarDB($conn);
            respuestaJSON(false, 'Equipo no encontrado');
        }
        
        // Eliminar equipo
        $sql = "DELETE FROM equipo WHERE id_equipo = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            cerrarDB($conn);
            respuestaJSON(true, 'Equipo eliminado correctamente');
        } else {
            cerrarDB($conn);
            respuestaJSON(false, 'Error al eliminar el equipo: ' . $stmt->error);
        }
        break;
        
    default:
        respuestaJSON(false, 'Método no permitido');
}

$conn->close();
?>