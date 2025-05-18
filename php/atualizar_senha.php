<?php
include "conexao.php";
header("Content-Type: application/json");

$email = $_POST['email'] ?? '';
$novaSenha = $_POST['novaSenha'] ?? '';

if (!$email || !$novaSenha) {
    echo json_encode(['status' => 'error', 'message' => 'Dados incompletos.']);
    exit;
}

// Atualiza a senha
$stmt = $con->prepare("UPDATE usuarios SET senha = ? WHERE email = ?");
$stmt->bind_param("ss", $novaSenha, $email);
if ($stmt->execute()) {
    //deletar os códigos antigos
    $deleteStmt = $con->prepare("DELETE FROM codigos_recuperacao WHERE email = ?");
    $deleteStmt->bind_param("s", $email);
    $deleteStmt->execute();

    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Erro ao atualizar senha.']);
}
?>
