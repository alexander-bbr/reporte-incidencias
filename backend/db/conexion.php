<?php
require_once __DIR__ . '/../config.php';

/**
 * Conecta a la base de datos MySQL
 * @return mysqli Objeto de conexión
 */
function conectarDB() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    // Verificar conexión
    if ($conn->connect_error) {
        die(json_encode([
            'success' => false,
            'mensaje' => 'Error de conexión a la base de datos: ' . $conn->connect_error
        ]));
    }
    
    // Configurar charset a UTF-8
    $conn->set_charset("utf8");
    
    return $conn;
}

/**
 * Cierra la conexión a la base de datos
 * @param mysqli $conn Conexión a cerrar
 */
function cerrarDB($conn) {
    if ($conn) {
        $conn->close();
    }
}
?>