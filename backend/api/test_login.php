<?php
header('Content-Type: application/json');

// Probar la conexión y el login manualmente
try {
    $conn = new mysqli('localhost', 'root', '', 'reporte_incidencias');
    
    if ($conn->connect_error) {
        echo json_encode(['success' => false, 'mensaje' => 'Error de conexión: ' . $conn->connect_error]);
        exit;
    }
    
    $cedula = '30717851';
    $sql = "SELECT cedula_usuario, contrasena, nombre, apellido, telefono, rol 
            FROM usuario 
            WHERE cedula_usuario = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $cedula);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'mensaje' => 'Usuario no encontrado']);
        exit;
    }
    
    $usuario = $result->fetch_assoc();
    $password = 'admin123';
    
    // Verificar contraseña
    $passwordValid = password_verify($password, $usuario['contrasena']);
    
    echo json_encode([
        'success' => true,
        'usuario_encontrado' => true,
        'password_valida' => $passwordValid,
        'usuario' => $usuario
    ]);
    
    $conn->close();
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'mensaje' => 'Error: ' . $e->getMessage()]);
}
?>