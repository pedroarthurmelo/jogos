<?php
session_start();
header("Content-Type: application/json");

$tempoMaximo = 120;

if (isset($_SESSION['user_id'])) {
    if (!isset($_SESSION['momento_login'])) {
        $_SESSION['momento_login'] = time();
    }

    $tempoPassado = time() - $_SESSION['momento_login'];

    if ($tempoPassado > $tempoMaximo) {
        session_unset();
        session_destroy(); 
        echo json_encode([
            'status' => 'expirado',
            'redirect_url' => '../html/login.html?reason=session_expired'
        ]);
        exit();
    }

    
    echo json_encode(['status' => 'logado', 'user_id' => $_SESSION['user_id']]);
    exit();

} else {
    
    echo json_encode([
        'status' => 'nao_logado_redirect',
        'redirect_url' => '../html/login.html?reason=not_logged_in'
    ]);
    exit();
}
?>