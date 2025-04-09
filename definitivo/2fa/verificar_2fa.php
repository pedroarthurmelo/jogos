<?php
session_start();
require_once __DIR__ . '/../2fa/vendor/autoload.php';
include '../php/conexao.php';

use Sonata\GoogleAuthenticator\GoogleAuthenticator;

$user_id = $_SESSION['user_id'] ?? null;
$secret = $_SESSION['google_2fa_secret'] ?? null;

if (!$user_id || !$secret) {
    header("Location: login.html");
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $codigo = $_POST['codigo'];

    $g = new GoogleAuthenticator();
    
    // Aqui garantimos que apenas o código atual é aceito (sem reuso)
    if ($g->checkCode($secret, $codigo, 0)) {
        $_SESSION['2fa_verificado'] = true;

        // Marca 2FA como confirmado no banco
        $stmt = $con->prepare("UPDATE usuarios SET 2fa_confirmado = 1 WHERE id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();

        header("Location: ../html/tela_principal.html");
        exit;
    } else {
        $erro = "Código inválido ou expirado. Tente novamente.";
    }
}
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Verificação 2FA</title>
    <link rel="stylesheet" href="../css/verificar_2fa.css">
</head>
<body>
    <div class="cabeçalho">
    <a href="bem_vindo.html" class="nav-logo-text">GameWorld</a>
    </div>
    <div class="container">
        <h1>Digite o código do Google Authenticator</h1>
        <form method="POST">
            <input type="text" name="codigo" required maxlength="6" pattern="\d{6}" placeholder="123456" />
            <button type="submit">Verificar</button>
        </form>
        <?php if (isset($erro)) echo "<p>$erro</p>"; ?>
    </div>
</body>
</html>