<?php
header('Content-Type: application/json');

// Probar conexión a la base de datos
try {
    $conn = new mysqli('localhost', 'root', '', 'reporte_incidencias');
    
    if ($conn->connect_error) {
        echo json_encode([
            'success' => false,
            'mensaje' => 'Error de conexión: ' . $conn->connect_error
        ]);
        exit;
    }
    
    // Verificar si la tabla usuario existe
    $result = $conn->query("SHOW TABLES LIKE 'usuario'");
    if ($result->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'mensaje' => 'La tabla "usuario" no existe en la base de datos'
        ]);
        $conn->close();
        exit;
    }
    
    // Contar usuarios
    $result = $conn->query("SELECT COUNT(*) as total FROM usuario");
    $row = $result->fetch_assoc();
    
    echo json_encode([
        'success' => true,
        'mensaje' => 'Conexión exitosa a la base de datos',
        'total_usuarios' => $row['total']
    ]);
    
    $conn->close();
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'mensaje' => 'Error: ' . $e->getMessage()
    ]);
}
?>