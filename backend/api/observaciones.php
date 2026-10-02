<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db/conexion.php';
require_once __DIR__ . '/../includes/funciones.php';

verificarSesion();

$method = $_SERVER['REQUEST_METHOD'];
$conn = conectarDB();

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $sql = "SELECT o.*, u.nombre, u.apellido 
                    FROM observacion o
                    INNER JOIN usuario u ON o.cedula_usuario = u.cedula_usuario
                    WHERE o.id_observacion = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $observacion = $result->fetch_assoc();
            
            if ($observacion) {
                respuestaJSON(true, 'Observación encontrada', ['observacion' => $observacion]);
            } else {
                respuestaJSON(false, 'Observación no encontrada');
            }
        } else {
            $sql = "SELECT o.*, u.nombre, u.apellido 
                    FROM observacion o
                    INNER JOIN usuario u ON o.cedula_usuario = u.cedula_usuario
                    ORDER BY o.fecha_creacion DESC";
            $result = $conn->query($sql);
            $observaciones = $result->fetch_all(MYSQLI_ASSOC);
            
            respuestaJSON(true, 'Observaciones obtenidas correctamente', ['observaciones' => $observaciones]);
        }
        break;
        
    case 'POST':
        // Crear observación
        $data = json_decode(file_get_contents('php://input'), true);
        
        $camposRequeridos = ['titulo', 'descripcion'];
        foreach ($camposRequeridos as $campo) {
            if (!isset($data[$campo]) || empty($data[$campo])) {
                respuestaJSON(false, "El campo '$campo' es requerido");
            }
        }
        
        $cedula_usuario = obtenerUsuarioActual()['cedula_usuario'];
        $titulo = sanitizar($data['titulo']);
        $descripcion = sanitizar($data['descripcion']);
        
        $sql = "INSERT INTO observacion (cedula_usuario, titulo, descripcion) 
                VALUES (?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sss", $cedula_usuario, $titulo, $descripcion);
        
        if ($stmt->execute()) {
            $id = $conn->insert_id;
            cerrarDB($conn);
            
            $observacionCreada = [
                'id_observacion' => $id,
                'cedula_usuario' => $cedula_usuario,
                'titulo' => $titulo,
                'descripcion' => $descripcion
            ];
            
            // Auditoría
            registrarAuditoria(
                'CREAR', 
                'observacion', 
                $id, 
                "Observación creada: $titulo", 
                null, 
                $observacionCreada
            );
            
            respuestaJSON(true, 'Observación creada correctamente', ['id' => $id]);
        } else {
            cerrarDB($conn);
            respuestaJSON(false, 'Error al crear la observación: ' . $stmt->error);
        }
        break;
        
    case 'PUT':
        // Actualizar observación
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['id']) || empty($data['id'])) {
            respuestaJSON(false, 'El ID es requerido');
        }
        
        $id = intval($data['id']);
        $titulo = sanitizar($data['titulo'] ?? '');
        $descripcion = sanitizar($data['descripcion'] ?? '');
        
        // Verificar que la observación existe
        $sql = "SELECT * FROM observacion WHERE id_observacion = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $datosAnteriores = $result->fetch_assoc();
        
        if (!$datosAnteriores) {
            cerrarDB($conn);
            respuestaJSON(false, 'Observación no encontrada');
        }
        
        $usuarioActual = obtenerUsuarioActual();
        
        // Solo el autor o un usuario de sistemas puede editar
        if ($datosAnteriores['cedula_usuario'] !== $usuarioActual['cedula_usuario'] && 
            $usuarioActual['rol'] !== 'SISTEMAS') {
            cerrarDB($conn);
            respuestaJSON(false, 'No tienes permiso para editar esta observación');
        }
        
        $sql = "UPDATE observacion SET titulo = ?, descripcion = ? WHERE id_observacion = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssi", $titulo, $descripcion, $id);
        
        if ($stmt->execute()) {
            // Obtener datos nuevos
            $sql = "SELECT * FROM observacion WHERE id_observacion = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $datosNuevos = $result->fetch_assoc();
            
            cerrarDB($conn);
            
            // Auditoría
            registrarAuditoria(
                'EDITAR', 
                'observacion', 
                $id, 
                "Observación editada: $titulo", 
                $datosAnteriores, 
                $datosNuevos
            );
            
            respuestaJSON(true, 'Observación actualizada correctamente');
        } else {
            cerrarDB($conn);
            respuestaJSON(false, 'Error al actualizar la observación: ' . $stmt->error);
        }
        break;
        
    case 'DELETE':
        // Eliminar observación
        if (!isset($_GET['id']) || empty($_GET['id'])) {
            respuestaJSON(false, 'El ID es requerido');
        }
        
        $id = intval($_GET['id']);
        
        // Obtener datos antes de eliminar
        $sql = "SELECT * FROM observacion WHERE id_observacion = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $datosEliminados = $result->fetch_assoc();
        
        if (!$datosEliminados) {
            cerrarDB($conn);
            respuestaJSON(false, 'Observación no encontrada');
        }
        
        $usuarioActual = obtenerUsuarioActual();
        
        // Solo el autor o un usuario de sistemas puede eliminar
        if ($datosEliminados['cedula_usuario'] !== $usuarioActual['cedula_usuario'] && 
            $usuarioActual['rol'] !== 'SISTEMAS') {
            cerrarDB($conn);
            respuestaJSON(false, 'No tienes permiso para eliminar esta observación');
        }
        
        $sql = "DELETE FROM observacion WHERE id_observacion = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            cerrarDB($conn);
            
            // Auditoría
            registrarAuditoria(
                'ELIMINAR', 
                'observacion', 
                $id, 
                "Observación eliminada: {$datosEliminados['titulo']}", 
                $datosEliminados, 
                null
            );
            
            respuestaJSON(true, 'Observación eliminada correctamente');
        } else {
            cerrarDB($conn);
            respuestaJSON(false, 'Error al eliminar la observación: ' . $stmt->error);
        }
        break;
        
    default:
        respuestaJSON(false, 'Método no permitido');
}

$conn->close();
?>