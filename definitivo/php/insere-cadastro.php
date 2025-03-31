<?php

    $username = $_POST["username"];
    $nome_completo = $_POST["nome_completo"];
    $email = $_POST["email"];
    $cpf = $_POST["cpf"];
    $telefone = $_POST["telefone"];
    $senha = $_POST["senha"];
    $confirmarSenha = $_POST["confirmarSenha"];

    include "conexao.php";

    mysqli_query($con, "INSERT INTO usuarios (username, nome_completo, email, cpf, telefone, senha, confirmar_senha) VALUES ('$username', '$nome_completo', '$email', '$cpf', '$telefone','$senha', '$confirmarSenha' ) ");
?>