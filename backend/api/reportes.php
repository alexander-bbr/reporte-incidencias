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
            
            // Equipos asociados
            $sql = "SELECT e.* FROM equipo e
                    INNER JOIN reporte_equipo re ON e.id_equipo = re.id_equipo
                    WHERE re.id_reporte = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $reporte['equipos'] = $result->fetch_all(MYSQLI_ASSOC);
            
            // Fallas asociadas
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
        
        if ($usuarioActual['rol'] === 'SISTEMAS') {
            respuestaJSON(false, 'Los usuarios de Sistemas no pueden crear reportes');
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
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
        
        $prioridadesValidas = ['BAJA', 'MEDIA', 'ALTA'];
        if (!in_array($prioridad, $prioridadesValidas)) {
            respuestaJSON(false, 'Prioridad no válida');
        }
        
        $conn->begin_transaction();
        
        try {
            $sql = "INSERT INTO reporte (cedula_usuario, titulo, descripcion, estado, prioridad, solucion) 
                    VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ssssss", $cedula_usuario, $titulo, $descripcion, $estado, $prioridad, $solucion);
            $stmt->execute();
            $id_reporte = $conn->insert_id;
            
            if (isset($data['equipos']) && is_array($data['equipos'])) {
                $sql = "INSERT INTO reporte_equipo (id_reporte, id_equipo) VALUES (?, ?)";
                $stmt = $conn->prepare($sql);
                foreach ($data['equipos'] as $id_equipo) {
                    $id_equipo = intval($id_equipo);
                    $stmt->bind_param("ii", $id_reporte, $id_equipo);
                    $stmt->execute();
                }
            }
            
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
            
            // Auditoría
            $reporteCreado = [
                'id_reporte' => $id_reporte,
                'titulo' => $titulo,
                'descripcion' => $descripcion,
                'prioridad' => $prioridad,
                'estado' => $estado,
                'equipos' => $data['equipos'] ?? [],
                'fallas' => $data['fallas'] ?? []
            ];
            
            registrarAuditoria(
                'CREAR', 
                'reporte', 
                $id_reporte, 
                "Reporte creado: $titulo", 
                null, 
                $reporteCreado
            );
            
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
        
        // Obtener datos anteriores (con equipos y fallas)
        $sql = "SELECT * FROM reporte WHERE id_reporte = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $datosAnteriores = $result->fetch_assoc();
        
        if (!$datosAnteriores) {
            cerrarDB($conn);
            respuestaJSON(false, 'Reporte no encontrado');
        }
        
        // Obtener equipos y fallas anteriores para auditoría
        $sql = "SELECT id_equipo FROM reporte_equipo WHERE id_reporte = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $datosAnteriores['equipos'] = array_column($result->fetch_all(MYSQLI_ASSOC), 'id_equipo');
        
        $sql = "SELECT id_falla FROM reporte_falla WHERE id_reporte = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $datosAnteriores['fallas'] = array_column($result->fetch_all(MYSQLI_ASSOC), 'id_falla');
        
        $conn->begin_transaction();
        
        try {
            if ($esSistemas) {
                // SISTEMAS solo actualiza estado y solución
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
                // COORDINADORA y ADMISIONISTA (no tocan estado ni solución)
                $titulo = sanitizar($data['titulo'] ?? '');
                $descripcion = sanitizar($data['descripcion'] ?? '');
                $prioridad = sanitizar($data['prioridad'] ?? '');
                
                if (!empty($prioridad)) {
                    $prioridadesValidas = ['BAJA', 'MEDIA', 'ALTA'];
                    if (!in_array($prioridad, $prioridadesValidas)) {
                        $conn->rollback();
                        cerrarDB($conn);
                        respuestaJSON(false, 'Prioridad no válida');
                    }
                }
                
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
            
            // Obtener datos nuevos
            $sql = "SELECT * FROM reporte WHERE id_reporte = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $datosNuevos = $result->fetch_assoc();
            
            $sql = "SELECT id_equipo FROM reporte_equipo WHERE id_reporte = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $datosNuevos['equipos'] = array_column($result->fetch_all(MYSQLI_ASSOC), 'id_equipo');
            
            $sql = "SELECT id_falla FROM reporte_falla WHERE id_reporte = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $datosNuevos['fallas'] = array_column($result->fetch_all(MYSQLI_ASSOC), 'id_falla');
            
            cerrarDB($conn);
            
            // Auditoría
            $descripcion = $esSistemas 
                ? "Reporte actualizado (estado/solución): {$datosNuevos['titulo']}"
                : "Reporte editado: {$datosNuevos['titulo']}";
            
            registrarAuditoria(
                'EDITAR', 
                'reporte', 
                $id, 
                $descripcion, 
                $datosAnteriores, 
                $datosNuevos
            );
            
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
        
        if ($usuarioActual['rol'] === 'SISTEMAS') {
            respuestaJSON(false, 'Los usuarios de Sistemas no pueden eliminar reportes');
        }
        
        if (!isset($_GET['id']) || empty($_GET['id'])) {
            respuestaJSON(false, 'El ID es requerido');
        }
        
        $id = intval($_GET['id']);
        
        // Obtener datos antes de eliminar
        $sql = "SELECT * FROM reporte WHERE id_reporte = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $datosEliminados = $result->fetch_assoc();
        
        if (!$datosEliminados) {
            cerrarDB($conn);
            respuestaJSON(false, 'Reporte no encontrado');
        }
        
        // Obtener equipos y fallas asociados
        $sql = "SELECT id_equipo FROM reporte_equipo WHERE id_reporte = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $datosEliminados['equipos'] = array_column($result->fetch_all(MYSQLI_ASSOC), 'id_equipo');
        
        $sql = "SELECT id_falla FROM reporte_falla WHERE id_reporte = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $datosEliminados['fallas'] = array_column($result->fetch_all(MYSQLI_ASSOC), 'id_falla');
        
        $conn->begin_transaction();
        
        try {
            $sql = "DELETE FROM reporte_equipo WHERE id_reporte = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            
            $sql = "DELETE FROM reporte_falla WHERE id_reporte = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            
            $sql = "DELETE FROM reporte WHERE id_reporte = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            
            $conn->commit();
            cerrarDB($conn);
            
            // Auditoría
            registrarAuditoria(
                'ELIMINAR', 
                'reporte', 
                $id, 
                "Reporte eliminado: {$datosEliminados['titulo']}", 
                $datosEliminados, 
                null
            );
            
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