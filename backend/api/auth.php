<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar solicitudes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db/conexion.php';
require_once __DIR__ . '/../includes/funciones.php';

// Obtener la acción
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'login':
        login();
        break;
        
    case 'logout':
        logout();
        break;
        
    case 'verificar':
        verificar();
        break;
        
    default:
        respuestaJSON(false, 'Acción no válida');
}

/**
 * Inicia sesión de usuario
 */
function login() {
    // Obtener datos del POST
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validar que lleguen los datos
    if (!$data || !isset($data['cedula']) || !isset($data['contrasena'])) {
        respuestaJSON(false, 'Faltan datos: cédula y contraseña son requeridos');
    }
    
    $cedula = sanitizar($data['cedula']);
    $contrasena = $data['contrasena'];
    
    // Validar que no estén vacíos
    if (empty($cedula) || empty($contrasena)) {
        respuestaJSON(false, 'La cédula y la contraseña son obligatorias');
    }
    
    // Conectar a la base de datos
    $conn = conectarDB();
    
    // Buscar usuario por cédula
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
    
    // Eliminar contraseña de los datos que se guardarán en sesión
    unset($usuario['contrasena']);
    
    // Guardar usuario en sesión
    $_SESSION['usuario'] = $usuario;
    
    cerrarDB($conn);
    
    respuestaJSON(true, 'Inicio de sesión exitoso', [
        'usuario' => $usuario
    ]);
}

/**
 * Cierra la sesión del usuario
 */
function logout() {
    // Destruir la sesión
    $_SESSION = array();
    
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    
    session_destroy();
    
    respuestaJSON(true, 'Sesión cerrada correctamente');
}

/**
 * Verifica si el usuario está autenticado
 */
function verificar() {
    if (estaAutenticado()) {
        respuestaJSON(true, 'Usuario autenticado', [
            'usuario' => $_SESSION['usuario']
        ]);
    } else {
        respuestaJSON(false, 'No autenticado');
    }
}
?>