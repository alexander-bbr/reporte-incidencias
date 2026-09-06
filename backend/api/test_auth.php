<?php
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'mensaje' => 'auth.php está funcionando correctamente'
]);
?>