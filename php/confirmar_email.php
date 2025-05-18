<?php
include "conexao.php";

header('Content-Type: application/json');

if (isset($_GET['email'])) {
    $email = $_GET['email'];

    // Verifica se o e-mail existe e está com status 'pendente'
    $query = "SELECT * FROM usuarios WHERE email = ? AND status = 'pendente'";
    $stmt = mysqli_prepare($con, $query);
    mysqli_stmt_bind_param($stmt, "s", $email);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    if (mysqli_num_rows($result) > 0) {
        // Atualiza o status para 'ativo'
        $updateQuery = "UPDATE usuarios SET status = 'ativo' WHERE email = ?";
        $updateStmt = mysqli_prepare($con, $updateQuery);
        mysqli_stmt_bind_param($updateStmt, "s", $email);

        if (mysqli_stmt_execute($updateStmt)) {
            echo json_encode(["status" => "sucesso", "mensagem" => "Cadastro confirmado com sucesso! Agora você pode fazer login."]);
        } else {
            echo json_encode(["status" => "erro", "mensagem" => "Erro ao ativar conta. Tente novamente mais tarde."]);
        }

        mysqli_stmt_close($updateStmt);
    } else {
        echo json_encode(["status" => "erro", "mensagem" => "Conta já ativada ou e-mail inválido."]);
    }

    mysqli_stmt_close($stmt);
} else {
    echo json_encode(["status" => "erro", "mensagem" => "E-mail inválido!"]);
}
?>
