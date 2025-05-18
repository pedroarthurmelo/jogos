<?php
include "conexao.php";
session_start();
header("Content-Type: application/json");

$email = $_POST["email"];
$senha = $_POST["senha"];

// Usando prepared statement para verificar o usuário
$query = "SELECT * FROM usuarios WHERE email = ?";
$stmt = mysqli_prepare($con, $query);
mysqli_stmt_bind_param($stmt, "s", $email);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

if (mysqli_num_rows($result) > 0) {
    $user = mysqli_fetch_assoc($result);

    // Verifica se a conta foi ativada
    if ($user['status'] !== 'ativo') {
        echo json_encode(["status" => "not_verified", "message" => "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada."]);
        exit;
    }

    // Verifica a senha (já em SHA256)
    if ($user['senha'] === $senha) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['email'] = $user['email'];

        if (!empty($user['google_2fa_secret'])) {
            // 2FA já está ativado, pede verificação
            $_SESSION['google_2fa_secret'] = $user['google_2fa_secret'];
            echo json_encode(["status" => "2fa_required", "message" => "Verificação 2FA necessária."]);
        } else {
            // Ainda não ativou o 2FA
            echo json_encode(["status" => "activate_2fa", "message" => "Você precisa ativar o 2FA."]);
        }

    } else {
        echo json_encode(["status" => "error", "message" => "Senha incorreta."]);
    }

} else {
    echo json_encode(["status" => "error", "message" => "Usuário não encontrado."]);
}

// Fechar o statement
mysqli_stmt_close($stmt);
?>
