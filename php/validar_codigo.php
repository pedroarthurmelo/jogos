<?php
include "conexao.php";
header("Content-Type: application/json");

$email = $_POST['email'] ?? '';
$codigo = $_POST['codigo'] ?? '';

if (!$email || !$codigo) {
    echo json_encode(['status' => 'error', 'message' => 'Dados incompletos.']);
    exit;
}

// Usando prepared statement para consultar o código de recuperação
$query = "SELECT * FROM codigos_recuperacao WHERE email = ? AND codigo = ? AND expiracao >= NOW() ORDER BY id DESC LIMIT 1";
$stmt = mysqli_prepare($con, $query);
mysqli_stmt_bind_param($stmt, "ss", $email, $codigo);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

if (mysqli_num_rows($result) > 0) {
    // Código válido
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Código inválido ou expirado.']);
}

// Fechar o statement
mysqli_stmt_close($stmt);
?>
