<?php
session_start(); //
header("Content-Type: application/json"); //
include 'conexao.php'; //

// Carregar chave privada do servidor
$privateKey = file_get_contents('private.pem');
if (!$privateKey) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensagem' => 'Falha ao carregar a chave privada do servidor.']);
    exit;
}

if (!isset($_SESSION['user_id'])) { //
    $responsePayload = json_encode(['status' => 'erro', 'mensagem' => 'Usuário não logado']); //
    // Se o usuário não estiver logado, não há chave AES do cliente para descriptografar.
    // Retornamos o erro em texto plano. O frontend deve lidar com o status 'erro'.
    echo $responsePayload;
    exit;
}

$userId = $_SESSION['user_id']; //

$encryptedData = $_POST['encryptedData'] ?? '';
$encryptedKey = $_POST['encryptedKey'] ?? '';

if (empty($encryptedData) || empty($encryptedKey)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'mensagem' => 'Dados de requisição incompletos.']);
    exit;
}

// 1. Descriptografar a chave AES (e IV) da requisição com a chave privada RSA do servidor
$decryptedRequestKeyJson = '';
if (!openssl_private_decrypt(base64_decode($encryptedKey), $decryptedRequestKeyJson, $privateKey)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'mensagem' => 'Falha na descriptografia da chave de sessão da requisição.']);
    exit;
}

$requestKeyData = json_decode($decryptedRequestKeyJson, true);
if (!$requestKeyData || !isset($requestKeyData['key']) || !isset($requestKeyData['iv'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'mensagem' => 'Formato inválido da chave de sessão da requisição.']);
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
    echo json_encode(['status' => 'error', 'mensagem' => 'Falha na descriptografia dos dados da requisição.']);
    exit;
}

// O payload decriptografado pode ser vazio, pois o user_id já vem da sessão.
// Se fosse esperado um ID de usuário no payload, seria processado aqui.

$query = "SELECT username, email, data_registro FROM usuarios WHERE id = ?"; //
$stmt = mysqli_prepare($con, $query); //
mysqli_stmt_bind_param($stmt, "i", $userId); //
mysqli_stmt_execute($stmt); //
$result = mysqli_stmt_get_result($stmt); //

if ($user = mysqli_fetch_assoc($result)) { //
    // Formatar a data, se desejar (ex: dd/mm/yyyy)
    $user['data_registro'] = date('d/m/Y', strtotime($user['data_registro'])); //
    
    $responsePayload = json_encode(['status' => 'ok', 'usuario' => $user]); //
} else {
    $responsePayload = json_encode(['status' => 'erro', 'mensagem' => 'Usuário não encontrado']); //
}
mysqli_stmt_close($stmt);


// 🔐 Criptografar a resposta (dados do perfil ou erro) com a mesma chave AES da requisição
$encryptedUserData = openssl_encrypt(
    $responsePayload,
    'aes-128-cbc',
    $requestAesKey, // Usar a mesma chave AES da requisição do cliente
    OPENSSL_RAW_DATA,
    $requestIv      // Usar o mesmo IV da requisição do cliente
);

if ($encryptedUserData === false) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensagem' => 'Falha ao criptografar os dados do usuário.']);
    exit;
}

echo json_encode([
    'encryptedUserData' => base64_encode($encryptedUserData)
]);
?>