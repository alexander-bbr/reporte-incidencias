<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db/conexion.php';
require_once __DIR__ . '/../includes/funciones.php';

verificarSesion();
verificarRol(['COORDINADORA']);

$method = $_SERVER['REQUEST_METHOD'];
$conn = conectarDB();

if ($method === 'GET') {
    // Filtros opcionales
    $condiciones = [];
    $params = [];
    $types = "";
    
    if (isset($_GET['tabla']) && !empty($_GET['tabla'])) {
        $condiciones[] = "a.tabla_afectada = ?";
        $params[] = sanitizar($_GET['tabla']);
        $types .= "s";
    }
    
    if (isset($_GET['accion']) && !empty($_GET['accion'])) {
        $condiciones[] = "a.accion = ?";
        $params[] = sanitizar($_GET['accion']);
        $types .= "s";
    }
    
    if (isset($_GET['cedula']) && !empty($_GET['cedula'])) {
        $condiciones[] = "a.cedula_usuario = ?";
        $params[] = sanitizar($_GET['cedula']);
        $types .= "s";
    }
    
    $sql = "SELECT 
                a.id_auditoria,
                a.cedula_usuario,
                a.accion,
                a.tabla_afectada,
                a.id_registro,
                a.descripcion,
                a.datos_anteriores,
                a.datos_nuevos,
                a.fecha,
                u.nombre AS nombre_usuario,
                u.apellido AS apellido_usuario
            FROM auditoria a
            LEFT JOIN usuario u ON a.cedula_usuario = u.cedula_usuario";
    
    if (count($condiciones) > 0) {
        $sql .= " WHERE " . implode(" AND ", $condiciones);
    }
    
    $sql .= " ORDER BY a.fecha DESC LIMIT 500";
    
    if (count($params) > 0) {
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        $result = $conn->query($sql);
    }
    
    $auditorias = $result->fetch_all(MYSQLI_ASSOC);
    
    cerrarDB($conn);
    respuestaJSON(true, 'Auditoría obtenida correctamente', ['auditorias' => $auditorias]);
} else {
    cerrarDB($conn);
    respuestaJSON(false, 'Método no permitido');
}

$conn->close();
?>