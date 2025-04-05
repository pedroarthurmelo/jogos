<?php
include "conexao.php";
header("Content-Type: application/json");

$email = $_POST['email'] ?? '';
$codigo = $_POST['codigo'] ?? '';

if (!$email || !$codigo) {
    echo json_encode(['status' => 'error', 'message' => 'Dados incompletos.']);
    exit;
}

$query = "SELECT * FROM codigos_recuperacao WHERE email = '$email' AND codigo = '$codigo' AND expiracao >= NOW() ORDER BY id DESC LIMIT 1";
$result = mysqli_query($con, $query);

if (mysqli_num_rows($result) > 0) {
    // Código válido
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Código inválido ou expirado.']);
}
?>
