<?php
session_start();
require_once __DIR__ . '/../2fa/vendor/autoload.php';
include '../php/conexao.php';

use Sonata\GoogleAuthenticator\GoogleAuthenticator;
use Sonata\GoogleAuthenticator\GoogleQrUrl;

$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) {
    header("Location: login.html");
    exit;
}

// Verifica se o 2FA já está confirmado
$check = $con->prepare("SELECT google_2fa_secret, 2fa_confirmado FROM usuarios WHERE id = ?");
$check->bind_param("i", $user_id);
$check->execute();
$result = $check->get_result();
$userData = $result->fetch_assoc();

if ($userData && $userData['2fa_confirmado']) {
    echo "<p>O 2FA já está ativado para este usuário.</p>";
    exit;
}

// Instancia o autenticador e gera nova chave
$g = new GoogleAuthenticator();
$secret = $g->generateSecret();

// Remove qualquer chave anterior da sessão e salva a nova
unset($_SESSION['google_2fa_secret']);
$_SESSION['google_2fa_secret'] = $secret;

// Atualiza a nova chave no banco e marca 2FA como não confirmado ainda
$stmt = $con->prepare("UPDATE usuarios SET google_2fa_secret = ?, 2fa_confirmado = 0 WHERE id = ?");
$stmt->bind_param("si", $secret, $user_id);
$stmt->execute();

// Gera QR code
$user = 'Pedro e Douglas' . $user_id;
$issuer = 'GameWorld';
$qrCodeUrl = GoogleQrUrl::generate($user, $secret, $issuer);
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Ativar 2FA</title>
    <link rel="stylesheet" href="../css/ativar_2fa.css">
</head>
<body>
    <div class="cabeçalho">
    <a href="bem_vindo.html" class="nav-logo-text">GameWorld</a>
    </div>

    <div class="container">
        <h1>Registre o QR Code no Google Authenticator</h1>
        <img src="<?php echo htmlspecialchars($qrCodeUrl); ?>" class="qrcode"alt="QR Code" >
        <p>Ou insira manualmente: <strong><?php echo $secret; ?></strong></p>
        <p>Depois de escanear o código, clique abaixo:</p>
        
        <form action="verificar_2fa.php" method="get">
            <button type="submit">Já escaneei</button>
        </form>
    </div>
</body>
</html>
