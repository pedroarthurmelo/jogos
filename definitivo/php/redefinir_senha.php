<?php
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['nova_senha'])) {
    $nova_senha = password_hash($_POST['senha'], PASSWORD_DEFAULT);
    $_SESSION['senha'] = $nova_senha;

    echo "Senha alterada com sucesso!";
}
?>
