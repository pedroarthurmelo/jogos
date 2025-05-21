<?php
session_start();
header("Content-Type: application/json");
include 'conexao.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Usuário não logado']);
    exit;
}

$userId = $_SESSION['user_id'];

$query = "SELECT username, email, data_registro FROM usuarios WHERE id = ?";
$stmt = mysqli_prepare($con, $query);
mysqli_stmt_bind_param($stmt, "i", $userId);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

if ($user = mysqli_fetch_assoc($result)) {
    // Formatar a data, se desejar (ex: dd/mm/yyyy)
    $user['data_registro'] = date('d/m/Y', strtotime($user['data_registro']));
    
    echo json_encode(['status' => 'ok', 'usuario' => $user]);
} else {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Usuário não encontrado']);
}
?>
