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
            $sql = "SELECT * FROM falla WHERE id_falla = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $falla = $result->fetch_assoc();
            
            if ($falla) {
                respuestaJSON(true, 'Falla encontrada', ['falla' => $falla]);
            } else {
                respuestaJSON(false, 'Falla no encontrada');
            }
        } else {
            $sql = "SELECT * FROM falla ORDER BY titulo";
            $result = $conn->query($sql);
            $fallas = $result->fetch_all(MYSQLI_ASSOC);
            
            respuestaJSON(true, 'Fallas obtenidas correctamente', ['fallas' => $fallas]);
        }
        break;
        
    case 'POST':
        // Crear falla
        $data = json_decode(file_get_contents('php://input'), true);
        
        $camposRequeridos = ['titulo', 'descripcion'];
        foreach ($camposRequeridos as $campo) {
            if (!isset($data[$campo]) || empty($data[$campo])) {
                respuestaJSON(false, "El campo '$campo' es requerido");
            }
        }
        
        $titulo = sanitizar($data['titulo']);
        $descripcion = sanitizar($data['descripcion']);
        
        $sql = "SELECT id_falla FROM falla WHERE titulo = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $titulo);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            cerrarDB($conn);
            respuestaJSON(false, 'Ya existe una falla con ese título');
        }
        
        $sql = "INSERT INTO falla (titulo, descripcion) VALUES (?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $titulo, $descripcion);
        
        if ($stmt->execute()) {
            $id = $conn->insert_id;
            cerrarDB($conn);
            
            $fallaCreada = [
                'id_falla' => $id,
                'titulo' => $titulo,
                'descripcion' => $descripcion
            ];
            
            // Auditoría
            registrarAuditoria(
                'CREAR', 
                'falla', 
                $id, 
                "Falla creada: $titulo", 
                null, 
                $fallaCreada
            );
            
            respuestaJSON(true, 'Falla creada correctamente', ['id' => $id]);
        } else {
            cerrarDB($conn);
            respuestaJSON(false, 'Error al crear la falla: ' . $stmt->error);
        }
        break;
        
    case 'PUT':
        // Actualizar falla
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['id']) || empty($data['id'])) {
            respuestaJSON(false, 'El ID es requerido');
        }
        
        $id = intval($data['id']);
        $titulo = sanitizar($data['titulo'] ?? '');
        $descripcion = sanitizar($data['descripcion'] ?? '');
        
        // Obtener datos anteriores
        $sql = "SELECT * FROM falla WHERE id_falla = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $datosAnteriores = $result->fetch_assoc();
        
        if (!$datosAnteriores) {
            cerrarDB($conn);
            respuestaJSON(false, 'Falla no encontrada');
        }
        
        // Verificar duplicado
        $sql = "SELECT id_falla FROM falla WHERE titulo = ? AND id_falla != ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $titulo, $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            cerrarDB($conn);
            respuestaJSON(false, 'Ya existe otra falla con ese título');
        }
        
        $sql = "UPDATE falla SET titulo = ?, descripcion = ? WHERE id_falla = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssi", $titulo, $descripcion, $id);
        
        if ($stmt->execute()) {
            // Obtener datos nuevos
            $sql = "SELECT * FROM falla WHERE id_falla = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $datosNuevos = $result->fetch_assoc();
            
            cerrarDB($conn);
            
            // Auditoría
            registrarAuditoria(
                'EDITAR', 
                'falla', 
                $id, 
                "Falla editada: $titulo", 
                $datosAnteriores, 
                $datosNuevos
            );
            
            respuestaJSON(true, 'Falla actualizada correctamente');
        } else {
            cerrarDB($conn);
            respuestaJSON(false, 'Error al actualizar la falla: ' . $stmt->error);
        }
        break;
        
    case 'DELETE':
        // Eliminar falla
        if (!isset($_GET['id']) || empty($_GET['id'])) {
            respuestaJSON(false, 'El ID es requerido');
        }
        
        $id = intval($_GET['id']);
        
        // Obtener datos antes de eliminar
        $sql = "SELECT * FROM falla WHERE id_falla = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $datosEliminados = $result->fetch_assoc();
        
        if (!$datosEliminados) {
            cerrarDB($conn);
            respuestaJSON(false, 'Falla no encontrada');
        }
        
        // Verificar si está siendo usada en reportes
        $sql = "SELECT id_reporte_falla FROM reporte_falla WHERE id_falla = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            cerrarDB($conn);
            respuestaJSON(false, 'No se puede eliminar la falla porque está asociada a uno o más reportes');
        }
        
        $sql = "DELETE FROM falla WHERE id_falla = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            cerrarDB($conn);
            
            // Auditoría
            registrarAuditoria(
                'ELIMINAR', 
                'falla', 
                $id, 
                "Falla eliminada: {$datosEliminados['titulo']}", 
                $datosEliminados, 
                null
            );
            
            respuestaJSON(true, 'Falla eliminada correctamente');
        } else {
            cerrarDB($conn);
            respuestaJSON(false, 'Error al eliminar la falla: ' . $stmt->error);
        }
        break;
        
    default:
        respuestaJSON(false, 'Método no permitido');
}

$conn->close();
?>