<?php
include "conexao.php";
session_start();
header("Content-Type: application/json");

// Carregar chave privada
$privateKey = file_get_contents('private.pem'); // Ensure this path is correct
if (!$privateKey) {
    echo json_encode(["status" => "error", "message" => "Falha ao carregar a chave privada do servidor."]);
    exit;
}

$encryptedLoginData = $_POST['encryptedLoginData'] ?? '';
$encryptedKey = $_POST['encryptedKey'] ?? '';

if (empty($encryptedLoginData) || empty($encryptedKey)) {
    echo json_encode(["status" => "error", "message" => "Dados incompletos."]);
    exit;
}

// 1. Descriptografar a chave AES (e IV) com a chave privada RSA
$decryptedKeyJson = '';
if (!openssl_private_decrypt(base64_decode($encryptedKey), $decryptedKeyJson, $privateKey)) {
    echo json_encode(["status" => "error", "message" => "Falha na descriptografia da chave de sessão."]);
    exit;
}

$keyData = json_decode($decryptedKeyJson, true);
if (!$keyData || !isset($keyData['key']) || !isset($keyData['iv'])) {
    echo json_encode(["status" => "error", "message" => "Formato inválido da chave de sessão."]);
    exit;
}

$aesKey = hex2bin($keyData['key']);
$iv = hex2bin($keyData['iv']);

// 2. Descriptografar os dados de login (email e senha hash) com a chave AES e IV
$decodedEncryptedLoginData = base64_decode($encryptedLoginData);
$decryptedLoginDataJson = openssl_decrypt(
    $decodedEncryptedLoginData,
    'aes-128-cbc',
    $aesKey,
    OPENSSL_RAW_DATA,
    $iv
);

if ($decryptedLoginDataJson === false) {
    echo json_encode(["status" => "error", "message" => "Falha na descriptografia dos dados de login."]);
    exit;
}

$loginData = json_decode($decryptedLoginDataJson, true);
if (!$loginData || !isset($loginData['email']) || !isset($loginData['password'])) {
    echo json_encode(["status" => "error", "message" => "Formato inválido dos dados de login descriptografados."]);
    exit;
}

$email = $loginData['email'];
$senha = $loginData['password']; // This is the SHA256 hashed password

// Now $email and $senha (hashed) are available for database verification.

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

    // Verifica a senha (o $senha já é o hash SHA256)
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