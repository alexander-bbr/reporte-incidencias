<?php
/**
 * Funciones auxiliares para el sistema
 */

/**
 * Verifica si el usuario está autenticado
 */
function estaAutenticado() {
    return isset($_SESSION['usuario']) && !empty($_SESSION['usuario']);
}

/**
 * Verifica la sesión y redirige si no está autenticado
 */
function verificarSesion($redirect = null) {
    if (!estaAutenticado()) {
        if ($redirect) {
            header("Location: $redirect");
        } else {
            echo json_encode([
                'success' => false,
                'mensaje' => 'No autorizado. Debes iniciar sesión.'
            ]);
            exit;
        }
    }
}

/**
 * Obtiene el usuario actual de la sesión
 */
function obtenerUsuarioActual() {
    return isset($_SESSION['usuario']) ? $_SESSION['usuario'] : null;
}

/**
 * Sanitiza una cadena para evitar inyección XSS
 */
function sanitizar($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Valida si un email tiene formato correcto
 */
function validarEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Genera una respuesta JSON
 */
function respuestaJSON($success, $mensaje, $data = null) {
    $response = [
        'success' => $success,
        'mensaje' => $mensaje
    ];
    
    if ($data !== null) {
        $response = array_merge($response, $data);
    }
    
    echo json_encode($response);
    exit;
}

/**
 * Verifica si el usuario actual tiene uno de los roles permitidos
 * Si no, corta la ejecución y devuelve error JSON
 * @param array $rolesPermitidos Lista de roles que pueden acceder
 */
function verificarRol($rolesPermitidos) {
    $usuario = obtenerUsuarioActual();
    
    if (!$usuario) {
        respuestaJSON(false, 'No autenticado');
    }
    
    if (!in_array($usuario['rol'], $rolesPermitidos)) {
        respuestaJSON(false, 'No tienes permisos para realizar esta acción');
    }
}
?>