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

/**
 * Registra una acción en la tabla de auditoría
 * @param string $accion - CREAR, EDITAR, ELIMINAR
 * @param string $tabla - Tabla afectada
 * @param string|null $idRegistro - ID del registro afectado
 * @param string|null $descripcion - Descripción legible
 * @param array|null $datosAnteriores - Datos antes del cambio (para EDITAR/ELIMINAR)
 * @param array|null $datosNuevos - Datos después del cambio (para CREAR/EDITAR)
 */
function registrarAuditoria($accion, $tabla, $idRegistro = null, $descripcion = null, $datosAnteriores = null, $datosNuevos = null) {
    $usuario = obtenerUsuarioActual();
    if (!$usuario) return;
    
    $cedula = $usuario['cedula_usuario'];
    
    $datosAnt = $datosAnteriores ? json_encode($datosAnteriores, JSON_UNESCAPED_UNICODE) : null;
    $datosNue = $datosNuevos ? json_encode($datosNuevos, JSON_UNESCAPED_UNICODE) : null;
    
    $conn = conectarDB();
    
    $sql = "INSERT INTO auditoria 
            (cedula_usuario, accion, tabla_afectada, id_registro, descripcion, datos_anteriores, datos_nuevos) 
            VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssssss", 
        $cedula, $accion, $tabla, $idRegistro, $descripcion, $datosAnt, $datosNue
    );
    $stmt->execute();
    
    cerrarDB($conn);
}
?>