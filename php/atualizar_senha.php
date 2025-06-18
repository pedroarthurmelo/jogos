<?php
include "conexao.php";
header("Content-Type: application/json");

// Carregar chave privada
$privateKey = file_get_contents('private.pem'); // Ensure this path is correct and secure
if (!$privateKey) {
    http_response_code(500);
    echo json_encode(['error' => 'Falha ao carregar a chave privada do servidor.']);
    exit;
}

$encryptedPasswordData = $_POST['encryptedPasswordData'] ?? '';
$encryptedKey = $_POST['encryptedKey'] ?? '';

if (empty($encryptedPasswordData) || empty($encryptedKey)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Dados incompletos.']);
    exit;
}

// 1. Descriptografar a chave AES (e IV) com a chave privada RSA
$decryptedKeyJson = '';
if (!openssl_private_decrypt(base64_decode($encryptedKey), $decryptedKeyJson, $privateKey)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Falha na descriptografia da chave de sessão.']);
    exit;
}

$keyData = json_decode($decryptedKeyJson, true);
if (!$keyData || !isset($keyData['key']) || !isset($keyData['iv'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Formato inválido da chave de sessão.']);
    exit;
}

$aesKey = hex2bin($keyData['key']);
$iv = hex2bin($keyData['iv']);

// 2. Descriptografar os dados da nova senha (e-mail e senha hash) com a chave AES e IV
$decodedEncryptedPasswordData = base64_decode($encryptedPasswordData);
$decryptedPasswordDataJson = openssl_decrypt(
    $decodedEncryptedPasswordData,
    'aes-128-cbc',
    $aesKey,
    OPENSSL_RAW_DATA,
    $iv
);

if ($decryptedPasswordDataJson === false) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Falha na descriptografia dos dados da nova senha.']);
    exit;
}

$passwordData = json_decode($decryptedPasswordDataJson, true);
if (!$passwordData || !isset($passwordData['email']) || !isset($passwordData['novaSenha'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Formato inválido dos dados da nova senha descriptografados.']);
    exit;
}

$email = $passwordData['email'];       // O e-mail descriptografado
$novaSenha = $passwordData['novaSenha']; // A nova senha (já em SHA256)

// Agora, o restante do seu código para atualizar a senha...
// Atualiza a senha
$stmt = $con->prepare("UPDATE usuarios SET senha = ? WHERE email = ?");
$stmt->bind_param("ss", $novaSenha, $email);
if ($stmt->execute()) {
    //deletar os códigos antigos
    $deleteStmt = $con->prepare("DELETE FROM codigos_recuperacao WHERE email = ?");
    $deleteStmt->bind_param("s", $email);
    $deleteStmt->execute();

    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Erro ao atualizar senha.']);
}
?>