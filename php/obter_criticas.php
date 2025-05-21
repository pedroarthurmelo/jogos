<?php
include 'conexao.php';

$jogo = $_GET['jogo'] ?? '';

$query = "SELECT u.username, c.texto 
          FROM criticas c
          JOIN usuarios u ON u.id = c.id_usuario
          WHERE c.jogo = ?
          ORDER BY c.data_criacao DESC";

$stmt = mysqli_prepare($con, $query);
mysqli_stmt_bind_param($stmt, "s", $jogo);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

$comentarios = [];
while ($row = mysqli_fetch_assoc($result)) {
    $comentarios[] = $row;
}

header("Content-Type: application/json");
echo json_encode($comentarios);
?>
