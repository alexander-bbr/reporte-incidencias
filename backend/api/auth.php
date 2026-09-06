<?php
// Forzar que siempre devuelva JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar solicitudes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['success' => true]);
    exit;
}

// Incluir archivos de configuración
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db/conexion.php';

// FUNCIÓN SIMPLIFICADA para respuestas JSON
function respuestaJSON($success, $mensaje, $data = null) {
    $response = ['success' => $success, 'mensaje' => $mensaje];
    if ($data !== null) {
        $response = array_merge($response, $data);
    }
    echo json_encode($response);
    exit;
}

// Obtener la acción
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Login SIMPLIFICADO
if ($action === 'login') {
    // Obtener datos del POST
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['cedula']) || !isset($data['contrasena'])) {
        respuestaJSON(false, 'Faltan datos');
    }
    
    $cedula = $data['cedula'];
    $contrasena = $data['contrasena'];
    
    // Conectar a la base de datos
    $conn = conectarDB();
    
    if (!$conn) {
        respuestaJSON(false, 'Error de conexión a BD');
    }
    
    // Buscar usuario
    $sql = "SELECT cedula_usuario, contrasena, nombre, apellido, telefono, rol 
            FROM usuario 
            WHERE cedula_usuario = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $cedula);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        cerrarDB($conn);
        respuestaJSON(false, 'Usuario no encontrado');
    }
    
    $usuario = $result->fetch_assoc();
    
    // Verificar contraseña
    if (!password_verify($contrasena, $usuario['contrasena'])) {
        cerrarDB($conn);
        respuestaJSON(false, 'Contraseña incorrecta');
    }
    
    unset($usuario['contrasena']);
    $_SESSION['usuario'] = $usuario;
    cerrarDB($conn);
    
    respuestaJSON(true, 'Login exitoso', ['usuario' => $usuario]);
    
} elseif ($action === 'logout') {
    $_SESSION = array();
    session_destroy();
    respuestaJSON(true, 'Sesión cerrada');
    
} elseif ($action === 'verificar') {
    if (isset($_SESSION['usuario'])) {
        respuestaJSON(true, 'Usuario autenticado', ['usuario' => $_SESSION['usuario']]);
    } else {
        respuestaJSON(false, 'No autenticado');
    }
    
} else {
    respuestaJSON(false, 'Acción no válida');
}
?>