<?php
session_start();
require_once __DIR__ . '/../2fa/vendor/autoload.php';
include '../php/conexao.php'; // Ensure this path is correct

use Sonata\GoogleAuthenticator\GoogleAuthenticator;

header('Content-Type: application/json');

// Carregar chave privada
$privateKey = file_get_contents('private.pem'); // Ensure this path is correct and secure
if (!$privateKey) {
    http_response_code(500);
    echo json_encode(['error' => 'Falha ao carregar a chave privada do servidor.']);
    exit;
}

$user_id = $_SESSION['user_id'] ?? null;
$secret = $_SESSION['google_2fa_secret'] ?? null;

if (!$user_id || !$secret) {
    http_response_code(401);
    echo json_encode(['error' => 'Sessão inválida.']);
    exit;
}

// Get encrypted data from POST
$encryptedCode = $_POST['encryptedCode'] ?? '';
$encryptedKey = $_POST['encryptedKey'] ?? '';

if (empty($encryptedCode) || empty($encryptedKey)) {
    http_response_code(400);
    echo json_encode(['error' => 'Dados incompletos.']);
    exit;
}

// 1. Descriptografar a chave AES (e IV) com a chave privada RSA
$decryptedKeyJson = '';
if (!openssl_private_decrypt(base64_decode($encryptedKey), $decryptedKeyJson, $privateKey)) {
    http_response_code(400);
    echo json_encode(['error' => 'Falha na descriptografia da chave de sessão.']);
    exit;
}

$keyData = json_decode($decryptedKeyJson, true);
if (!$keyData || !isset($keyData['key']) || !isset($keyData['iv'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Formato inválido da chave de sessão.']);
    exit;
}

$aesKey = hex2bin($keyData['key']);
$iv = hex2bin($keyData['iv']);

// 2. Descriptografar o código 2FA com a chave AES e IV
$decodedEncryptedCode = base64_decode($encryptedCode);
$decryptedCodeJson = openssl_decrypt(
    $decodedEncryptedCode,
    'aes-128-cbc',
    $aesKey,
    OPENSSL_RAW_DATA,
    $iv
);

if ($decryptedCodeJson === false) {
    http_response_code(400);
    echo json_encode(['error' => 'Falha na descriptografia do código 2FA.']);
    exit;
}

$codeData = json_decode($decryptedCodeJson, true);
if (!$codeData || !isset($codeData['code'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Formato inválido dos dados do código 2FA descriptografados.']);
    exit;
}

$codigo = $codeData['code']; // This is the actual 2FA code

// Perform 2FA verification with the decrypted code
$g = new GoogleAuthenticator();
if ($g->checkCode($secret, $codigo, 0)) {
    $_SESSION['2fa_verificado'] = true;

    // Update 2fa_confirmado status only if it's the first time verifying after activation
    // You might want to remove this update if 2fa_confirmado is only set during activation
    // and not on subsequent verifications. This depends on your desired logic.
    $stmt = $con->prepare("UPDATE usuarios SET 2fa_confirmado = 1 WHERE id = ?");
    if ($stmt) {
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $stmt->close();
    } else {
        // Handle prepare error if necessary
        error_log("Failed to prepare statement for 2FA confirmation update: " . $con->error);
    }

    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Código inválido ou expirado.']);
}