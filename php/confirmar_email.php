<?php
include "conexao.php";

if (isset($_GET['email'])) {
    $email = $_GET['email'];

    // Verifica se o e-mail existe no banco de dados
    $query = "SELECT * FROM usuarios WHERE email = '$email' AND status = 'pendente'";
    $result = mysqli_query($con, $query);

    if (mysqli_num_rows($result) > 0) {
        // Atualiza o status para 'ativo'
        $updateQuery = "UPDATE usuarios SET status = 'ativo' WHERE email = '$email'";
        if (mysqli_query($con, $updateQuery)) {
            $mensagem = "Cadastro confirmado com sucesso! Agora você pode fazer login.";
        } else {
            $mensagem = "Erro ao ativar conta. Tente novamente mais tarde.";
        }
    } else {
        $mensagem = "Conta já ativada ou e-mail inválido.";
    }
} else {
    $mensagem = "E-mail inválido!";
}
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmação de Cadastro</title>
    <link rel="stylesheet" href="../css/confirmar_email.css">
</head>
<body>
    <div class="cabeçalho">
    <a href="bem_vindo.html" class="nav-logo-text">GameWorld</a>
    </div>
    <div class="container">
        <h1><?php echo $mensagem; ?></h1>
        <br>
        <a href="../html/login.html" class="btn">Ir para Login</a>
    </div>
</body>
</html>
