<?php
session_start();
header("Content-Type: application/json");

$tempoMaximo = 120; // segundos após o login

if (isset($_SESSION['user_id'])) {
    if (!isset($_SESSION['momento_login'])) {
        $_SESSION['momento_login'] = time(); // Armazena o horário do login
    }

    $tempoPassado = time() - $_SESSION['momento_login'];

    if ($tempoPassado > $tempoMaximo) {
        session_unset();
        session_destroy();
        echo json_encode(['status' => 'expirado']);
        exit();
    }

    echo json_encode(['status' => 'logado', 'user_id' => $_SESSION['user_id']]);
} else {
    echo json_encode(['status' => 'nao_logado']);
}
?>
