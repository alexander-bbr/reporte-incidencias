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
            // Obtener un reporte específico con sus relaciones
            $id = intval($_GET['id']);
            
            $sql = "SELECT r.*, u.nombre, u.apellido 
                    FROM reporte r
                    INNER JOIN usuario u ON r.cedula_usuario = u.cedula_usuario
                    WHERE r.id_reporte = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $reporte = $result->fetch_assoc();
            
            if (!$reporte) {
                cerrarDB($conn);
                respuestaJSON(false, 'Reporte no encontrado');
            }
            
            // Obtener equipos asociados
            $sql = "SELECT e.* FROM equipo e
                    INNER JOIN reporte_equipo re ON e.id_equipo = re.id_equipo
                    WHERE re.id_reporte = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $reporte['equipos'] = $result->fetch_all(MYSQLI_ASSOC);
            
            // Obtener fallas asociadas
            $sql = "SELECT f.* FROM falla f
                    INNER JOIN reporte_falla rf ON f.id_falla = rf.id_falla
                    WHERE rf.id_reporte = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $reporte['fallas'] = $result->fetch_all(MYSQLI_ASSOC);
            
            cerrarDB($conn);
            respuestaJSON(true, 'Reporte encontrado', ['reporte' => $reporte]);
        } else {
            // Obtener todos los reportes
            $sql = "SELECT r.*, u.nombre, u.apellido 
                    FROM reporte r
                    INNER JOIN usuario u ON r.cedula_usuario = u.cedula_usuario
                    ORDER BY r.fecha_creacion DESC";
            $result = $conn->query($sql);
            $reportes = $result->fetch_all(MYSQLI_ASSOC);
            
            cerrarDB($conn);
            respuestaJSON(true, 'Reportes obtenidos correctamente', ['reportes' => $reportes]);
        }
        break;
        
    case 'POST':
        // Crear reporte
        $usuarioActual = obtenerUsuarioActual();
        
        // SISTEMAS no puede crear reportes
        if ($usuarioActual['rol'] === 'SISTEMAS') {
            respuestaJSON(false, 'Los usuarios de Sistemas no pueden crear reportes');
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validar campos requeridos
        if (!isset($data['titulo']) || empty($data['titulo'])) {
            respuestaJSON(false, 'El título es requerido');
        }
        
        if (!isset($data['descripcion']) || empty($data['descripcion'])) {
            respuestaJSON(false, 'La descripción es requerida');
        }
        
        if (!isset($data['prioridad']) || empty($data['prioridad'])) {
            respuestaJSON(false, 'La prioridad es requerida');
        }
        
        $cedula_usuario = $usuarioActual['cedula_usuario'];
        $titulo = sanitizar($data['titulo']);
        $descripcion = sanitizar($data['descripcion']);
        $prioridad = sanitizar($data['prioridad']);
        $estado = 'PENDIENTE';
        $solucion = null;
        
        // Validar prioridad
        $prioridadesValidas = ['BAJA', 'MEDIA', 'ALTA'];
        if (!in_array($prioridad, $prioridadesValidas)) {
            respuestaJSON(false, 'Prioridad no válida');
        }
        
        // Iniciar transacción
        $conn->begin_transaction();
        
        try {
            // Insertar reporte
            $sql = "INSERT INTO reporte (cedula_usuario, titulo, descripcion, estado, prioridad, solucion) 
                    VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ssssss", $cedula_usuario, $titulo, $descripcion, $estado, $prioridad, $solucion);
            $stmt->execute();
            $id_reporte = $conn->insert_id;
            
            // Insertar equipos asociados
            if (isset($data['equipos']) && is_array($data['equipos'])) {
                $sql = "INSERT INTO reporte_equipo (id_reporte, id_equipo) VALUES (?, ?)";
                $stmt = $conn->prepare($sql);
                foreach ($data['equipos'] as $id_equipo) {
                    $id_equipo = intval($id_equipo);
                    $stmt->bind_param("ii", $id_reporte, $id_equipo);
                    $stmt->execute();
                }
            }
            
            // Insertar fallas asociadas
            if (isset($data['fallas']) && is_array($data['fallas'])) {
                $sql = "INSERT INTO reporte_falla (id_reporte, id_falla) VALUES (?, ?)";
                $stmt = $conn->prepare($sql);
                foreach ($data['fallas'] as $id_falla) {
                    $id_falla = intval($id_falla);
                    $stmt->bind_param("ii", $id_reporte, $id_falla);
                    $stmt->execute();
                }
            }
            
            $conn->commit();
            cerrarDB($conn);
            respuestaJSON(true, 'Reporte creado correctamente', ['id' => $id_reporte]);
        } catch (Exception $e) {
            $conn->rollback();
            cerrarDB($conn);
            respuestaJSON(false, 'Error al crear el reporte: ' . $e->getMessage());
        }
        break;
        
    case 'PUT':
        // Actualizar reporte
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['id']) || empty($data['id'])) {
            respuestaJSON(false, 'El ID es requerido');
        }
        
        $id = intval($data['id']);
        $usuarioActual = obtenerUsuarioActual();
        $esSistemas = ($usuarioActual['rol'] === 'SISTEMAS');
        
        // Verificar que el reporte existe
        $sql = "SELECT id_reporte, cedula_usuario FROM reporte WHERE id_reporte = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $reporte = $result->fetch_assoc();
        
        if (!$reporte) {
            cerrarDB($conn);
            respuestaJSON(false, 'Reporte no encontrado');
        }
        
        // Iniciar transacción
        $conn->begin_transaction();
        
        try {
            if ($esSistemas) {
                // SISTEMAS solo puede actualizar Estado y Solución
                $estado = sanitizar($data['estado'] ?? '');
                $solucion = isset($data['solucion']) ? sanitizar($data['solucion']) : '';
                
                if (!empty($estado)) {
                    $estadosValidos = ['PENDIENTE', 'EN REVISION', 'REVISADO'];
                    if (!in_array($estado, $estadosValidos)) {
                        $conn->rollback();
                        cerrarDB($conn);
                        respuestaJSON(false, 'Estado no válido');
                    }
                }
                
                $sql = "UPDATE reporte SET estado = ?, solucion = ? WHERE id_reporte = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("ssi", $estado, $solucion, $id);
                $stmt->execute();
                
            } else {
                // ADMISIONISTA y COORDINADORA pueden editar todo
                $titulo = sanitizar($data['titulo'] ?? '');
                $descripcion = sanitizar($data['descripcion'] ?? '');
                $estado = sanitizar($data['estado'] ?? '');
                $prioridad = sanitizar($data['prioridad'] ?? '');
                
                // Validar estado y prioridad
                if (!empty($estado)) {
                    $estadosValidos = ['PENDIENTE', 'EN REVISION', 'REVISADO'];
                    if (!in_array($estado, $estadosValidos)) {
                        $conn->rollback();
                        cerrarDB($conn);
                        respuestaJSON(false, 'Estado no válido');
                    }
                }
                
                if (!empty($prioridad)) {
                    $prioridadesValidas = ['BAJA', 'MEDIA', 'ALTA'];
                    if (!in_array($prioridad, $prioridadesValidas)) {
                        $conn->rollback();
                        cerrarDB($conn);
                        respuestaJSON(false, 'Prioridad no válida');
                    }
                }
                
                // Construir la consulta dinámicamente
                $sql = "UPDATE reporte SET ";
                $params = [];
                $types = "";
                
                if (!empty($titulo)) {
                    $sql .= "titulo = ?, ";
                    $params[] = $titulo;
                    $types .= "s";
                }
                
                if (!empty($descripcion)) {
                    $sql .= "descripcion = ?, ";
                    $params[] = $descripcion;
                    $types .= "s";
                }
                
                if (!empty($estado)) {
                    $sql .= "estado = ?, ";
                    $params[] = $estado;
                    $types .= "s";
                }
                
                if (!empty($prioridad)) {
                    $sql .= "prioridad = ?, ";
                    $params[] = $prioridad;
                    $types .= "s";
                }
                
                $sql = rtrim($sql, ", ");
                $sql .= " WHERE id_reporte = ?";
                $params[] = $id;
                $types .= "i";
                
                $stmt = $conn->prepare($sql);
                $stmt->bind_param($types, ...$params);
                $stmt->execute();
                
                // Actualizar equipos asociados (eliminar y volver a insertar)
                if (isset($data['equipos']) && is_array($data['equipos'])) {
                    $sql = "DELETE FROM reporte_equipo WHERE id_reporte = ?";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("i", $id);
                    $stmt->execute();
                    
                    $sql = "INSERT INTO reporte_equipo (id_reporte, id_equipo) VALUES (?, ?)";
                    $stmt = $conn->prepare($sql);
                    foreach ($data['equipos'] as $id_equipo) {
                        $id_equipo = intval($id_equipo);
                        $stmt->bind_param("ii", $id, $id_equipo);
                        $stmt->execute();
                    }
                }
                
                // Actualizar fallas asociadas
                if (isset($data['fallas']) && is_array($data['fallas'])) {
                    $sql = "DELETE FROM reporte_falla WHERE id_reporte = ?";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("i", $id);
                    $stmt->execute();
                    
                    $sql = "INSERT INTO reporte_falla (id_reporte, id_falla) VALUES (?, ?)";
                    $stmt = $conn->prepare($sql);
                    foreach ($data['fallas'] as $id_falla) {
                        $id_falla = intval($id_falla);
                        $stmt->bind_param("ii", $id, $id_falla);
                        $stmt->execute();
                    }
                }
            }
            
            $conn->commit();
            cerrarDB($conn);
            respuestaJSON(true, 'Reporte actualizado correctamente');
        } catch (Exception $e) {
            $conn->rollback();
            cerrarDB($conn);
            respuestaJSON(false, 'Error al actualizar el reporte: ' . $e->getMessage());
        }
        break;
        
    case 'DELETE':
        // Eliminar reporte
        $usuarioActual = obtenerUsuarioActual();
        
        // SISTEMAS no puede eliminar reportes
        if ($usuarioActual['rol'] === 'SISTEMAS') {
            respuestaJSON(false, 'Los usuarios de Sistemas no pueden eliminar reportes');
        }
        
        if (!isset($_GET['id']) || empty($_GET['id'])) {
            respuestaJSON(false, 'El ID es requerido');
        }
        
        $id = intval($_GET['id']);
        
        // Verificar que el reporte existe
        $sql = "SELECT id_reporte FROM reporte WHERE id_reporte = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            cerrarDB($conn);
            respuestaJSON(false, 'Reporte no encontrado');
        }
        
        // Iniciar transacción
        $conn->begin_transaction();
        
        try {
            // Eliminar relaciones
            $sql = "DELETE FROM reporte_equipo WHERE id_reporte = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            
            $sql = "DELETE FROM reporte_falla WHERE id_reporte = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            
            // Eliminar reporte
            $sql = "DELETE FROM reporte WHERE id_reporte = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            
            $conn->commit();
            cerrarDB($conn);
            respuestaJSON(true, 'Reporte eliminado correctamente');
        } catch (Exception $e) {
            $conn->rollback();
            cerrarDB($conn);
            respuestaJSON(false, 'Error al eliminar el reporte: ' . $e->getMessage());
        }
        break;
        
    default:
        respuestaJSON(false, 'Método no permitido');
}

$conn->close();
?>