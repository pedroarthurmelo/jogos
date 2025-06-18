<?php
session_start(); //
require_once 'conexao.php'; // conexão com o banco

header('Content-Type: application/json'); //

// Carregar chave privada do servidor
$privateKey = file_get_contents('private.pem');
if (!$privateKey) {
    http_response_code(500);
    echo json_encode(['error' => 'Falha ao carregar a chave privada do servidor.']);
    exit;
}

$encryptedData = $_POST['encryptedData'] ?? '';
$encryptedKey = $_POST['encryptedKey'] ?? '';

if (empty($encryptedData) || empty($encryptedKey)) {
    http_response_code(400);
    echo json_encode(['error' => 'Dados de requisição incompletos.']);
    exit;
}

// 1. Descriptografar a chave AES (e IV) da requisição com a chave privada RSA do servidor
$decryptedRequestKeyJson = '';
if (!openssl_private_decrypt(base64_decode($encryptedKey), $decryptedRequestKeyJson, $privateKey)) {
    http_response_code(400);
    echo json_encode(['error' => 'Falha na descriptografia da chave de sessão da requisição.']);
    exit;
}

$requestKeyData = json_decode($decryptedRequestKeyJson, true);
if (!$requestKeyData || !isset($requestKeyData['key']) || !isset($requestKeyData['iv'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Formato inválido da chave de sessão da requisição.']);
    exit;
}

$requestAesKey = hex2bin($requestKeyData['key']);
$requestIv = hex2bin($requestKeyData['iv']);

// 2. Descriptografar os dados da requisição (pode ser vazio, apenas para validar o handshake)
$decodedEncryptedData = base64_decode($encryptedData);
$decryptedRequestDataJson = openssl_decrypt(
    $decodedEncryptedData,
    'aes-128-cbc',
    $requestAesKey,
    OPENSSL_RAW_DATA,
    $requestIv
);

if ($decryptedRequestDataJson === false) {
    http_response_code(400);
    echo json_encode(['error' => 'Falha na descriptografia dos dados da requisição.']);
    exit;
}


// **GARANTIA**: Certifique-se de que 'imagem' está sendo selecionado aqui
$sql = "SELECT id, nome, imagem, avaliacao FROM jogos ORDER BY data_lancamento DESC"; //
$result = $con->query($sql); //

$dados = []; //

if ($result && $result->num_rows > 0) { //
    while ($row = $result->fetch_assoc()) { //
        $dados[] = $row; //
    }
}

$responsePayload = json_encode($dados); //

// 🔐 Criptografar a resposta (lista de jogos) com a mesma chave AES da requisição
$encryptedJogosData = openssl_encrypt(
    $responsePayload,
    'aes-128-cbc',
    $requestAesKey, 
    OPENSSL_RAW_DATA,
    $requestIv      
);

if ($encryptedJogosData === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Falha ao criptografar os dados da lista de jogos.']);
    exit;
}

echo json_encode([
    'encryptedJogosData' => base64_encode($encryptedJogosData)
]);
?>