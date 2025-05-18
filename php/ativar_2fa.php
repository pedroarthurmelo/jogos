<?php
session_start();
require_once __DIR__ . '/../2fa/vendor/autoload.php';
include '../php/conexao.php';

use Sonata\GoogleAuthenticator\GoogleAuthenticator;
use Sonata\GoogleAuthenticator\GoogleQrUrl;

header('Content-Type: application/json');

$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) {
    http_response_code(401);
    echo json_encode(['error' => 'Usuário não autenticado.']);
    exit;
}

// Verifica se o 2FA já está confirmado
$check = $con->prepare("SELECT google_2fa_secret, 2fa_confirmado FROM usuarios WHERE id = ?");
$check->bind_param("i", $user_id);
$check->execute();
$result = $check->get_result();
$userData = $result->fetch_assoc();

if ($userData && $userData['2fa_confirmado']) {
    echo json_encode(['message' => 'O 2FA já está ativado.']);
    exit;
}

// Instancia autenticador
$g = new GoogleAuthenticator();
$secret = $g->generateSecret();

// Armazena chave na sessão
$_SESSION['google_2fa_secret'] = $secret;

// Atualiza no banco
$stmt = $con->prepare("UPDATE usuarios SET google_2fa_secret = ?, 2fa_confirmado = 0 WHERE id = ?");
$stmt->bind_param("si", $secret, $user_id);
$stmt->execute();

// Gera QR Code
$user = 'Pedro e Douglas' . $user_id;
$issuer = 'GameWorld';
$qrCodeUrl = GoogleQrUrl::generate($user, $secret, $issuer);

// Retorna dados em JSON
echo json_encode([
    'secret' => $secret,
    'qrCodeUrl' => $qrCodeUrl
]);
