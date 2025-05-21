<?php
session_start();
header("Content-Type: application/json");
include 'conexao.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Usuário não logado']);
    exit;
}

$userId = $_SESSION['user_id'];
$dados = json_decode(file_get_contents("php://input"), true);

$texto = trim($dados['critica']);
$jogo = trim($dados['jogo']);

if (empty($texto) || empty($jogo)) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Crítica ou nome do jogo vazio']);
    exit;
}

$query = "INSERT INTO criticas (id_usuario, jogo, texto) VALUES (?, ?, ?)";
$stmt = mysqli_prepare($con, $query);
mysqli_stmt_bind_param($stmt, "iss", $userId, $jogo, $texto);

if (mysqli_stmt_execute($stmt)) {
    echo json_encode(['status' => 'ok']);
} else {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro ao salvar crítica']);
}
?>
