<?php
/**
 * Funciones auxiliares para el sistema
 */

/**
 * Verifica si el usuario está autenticado
 * @return bool True si está autenticado, false si no
 */
function estaAutenticado() {
    return isset($_SESSION['usuario']) && !empty($_SESSION['usuario']);
}

/**
 * Verifica la sesión y redirige si no está autenticado
 * @param string $redirect URL de redirección (opcional)
 */
function verificarSesion($redirect = null) {
    if (!estaAutenticado()) {
        if ($redirect) {
            header("Location: $redirect");
        } else {
            // Para API
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
 * @return array|null Datos del usuario o null si no hay sesión
 */
function obtenerUsuarioActual() {
    return isset($_SESSION['usuario']) ? $_SESSION['usuario'] : null;
}

/**
 * Sanitiza una cadena para evitar inyección XSS
 * @param string $input Cadena a sanitizar
 * @return string Cadena sanitizada
 */
function sanitizar($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Valida si un email tiene formato correcto
 * @param string $email Email a validar
 * @return bool True si es válido, false si no
 */
function validarEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Genera una respuesta JSON
 * @param bool $success Éxito o fracaso
 * @param string $mensaje Mensaje descriptivo
 * @param array $data Datos adicionales (opcional)
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
?>