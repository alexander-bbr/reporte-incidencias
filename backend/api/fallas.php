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
            // Obtener una falla específica
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
            // Obtener todas las fallas
            $sql = "SELECT * FROM falla ORDER BY titulo";
            $result = $conn->query($sql);
            $fallas = $result->fetch_all(MYSQLI_ASSOC);
            
            respuestaJSON(true, 'Fallas obtenidas correctamente', ['fallas' => $fallas]);
        }
        break;
        
    case 'POST':
        // Crear falla
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validar campos requeridos
        $camposRequeridos = ['titulo', 'descripcion'];
        foreach ($camposRequeridos as $campo) {
            if (!isset($data[$campo]) || empty($data[$campo])) {
                respuestaJSON(false, "El campo '$campo' es requerido");
            }
        }
        
        $titulo = sanitizar($data['titulo']);
        $descripcion = sanitizar($data['descripcion']);
        
        // Verificar si ya existe una falla con el mismo título
        $sql = "SELECT id_falla FROM falla WHERE titulo = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $titulo);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            cerrarDB($conn);
            respuestaJSON(false, 'Ya existe una falla con ese título');
        }
        
        // Insertar falla
        $sql = "INSERT INTO falla (titulo, descripcion) VALUES (?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $titulo, $descripcion);
        
        if ($stmt->execute()) {
            $id = $conn->insert_id;
            cerrarDB($conn);
            respuestaJSON(true, 'Falla creada correctamente', [
                'id' => $id,
                'falla' => [
                    'id_falla' => $id,
                    'titulo' => $titulo,
                    'descripcion' => $descripcion
                ]
            ]);
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
        
        // Verificar que la falla existe
        $sql = "SELECT id_falla FROM falla WHERE id_falla = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            cerrarDB($conn);
            respuestaJSON(false, 'Falla no encontrada');
        }
        
        // Verificar que no haya duplicado de título (excluyendo la actual)
        $sql = "SELECT id_falla FROM falla WHERE titulo = ? AND id_falla != ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $titulo, $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            cerrarDB($conn);
            respuestaJSON(false, 'Ya existe otra falla con ese título');
        }
        
        // Actualizar falla
        $sql = "UPDATE falla SET titulo = ?, descripcion = ? WHERE id_falla = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssi", $titulo, $descripcion, $id);
        
        if ($stmt->execute()) {
            cerrarDB($conn);
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
        
        // Verificar que la falla existe
        $sql = "SELECT id_falla FROM falla WHERE id_falla = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            cerrarDB($conn);
            respuestaJSON(false, 'Falla no encontrada');
        }
        
        // Verificar si la falla está siendo usada en reportes
        $sql = "SELECT id_reporte_falla FROM reporte_falla WHERE id_falla = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            cerrarDB($conn);
            respuestaJSON(false, 'No se puede eliminar la falla porque está asociada a uno o más reportes');
        }
        
        // Eliminar falla
        $sql = "DELETE FROM falla WHERE id_falla = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            cerrarDB($conn);
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