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

$encryptedValidationData = $_POST['encryptedValidationData'] ?? '';
$encryptedKey = $_POST['encryptedKey'] ?? '';

if (empty($encryptedValidationData) || empty($encryptedKey)) {
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

// 2. Descriptografar os dados de validação (e-mail e código) com a chave AES e IV
$decodedEncryptedValidationData = base64_decode($encryptedValidationData);
$decryptedValidationDataJson = openssl_decrypt(
    $decodedEncryptedValidationData,
    'aes-128-cbc',
    $aesKey,
    OPENSSL_RAW_DATA,
    $iv
);

if ($decryptedValidationDataJson === false) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Falha na descriptografia dos dados de validação.']);
    exit;
}

$validationData = json_decode($decryptedValidationDataJson, true);
if (!$validationData || !isset($validationData['email']) || !isset($validationData['codigo'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Formato inválido dos dados de validação descriptografados.']);
    exit;
}

$email = $validationData['email'];   // O e-mail descriptografado
$codigo = $validationData['codigo']; // O código descriptografado

// Agora, o restante do seu código para validar o código...
// Usando prepared statement para consultar o código de recuperação
$query = "SELECT * FROM codigos_recuperacao WHERE email = ? AND codigo = ? AND expiracao >= NOW() ORDER BY id DESC LIMIT 1";
$stmt = mysqli_prepare($con, $query);
mysqli_stmt_bind_param($stmt, "ss", $email, $codigo);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

if (mysqli_num_rows($result) > 0) {
    // Código válido
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Código inválido ou expirado.']);
}

// Fechar o statement
mysqli_stmt_close($stmt);
?>