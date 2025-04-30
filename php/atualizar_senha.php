<?php
include "conexao.php";
header("Content-Type: application/json");

$email = $_POST['email'] ?? '';
$novaSenha = $_POST['novaSenha'] ?? '';

if (!$email || !$novaSenha) {
    echo json_encode(['status' => 'error', 'message' => 'Dados incompletos.']);
    exit;
}

$query = "UPDATE usuarios SET senha = '$novaSenha' WHERE email = '$email'";
if (mysqli_query($con, $query)) {
    // Remove códigos antigos (boa prática)
    mysqli_query($con, "DELETE FROM codigos_recuperacao WHERE email = '$email'");
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Erro ao atualizar senha.']);
}
?>
