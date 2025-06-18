<?php
header("Content-Type: application/json"); //

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

// 2. Descriptografar os dados da requisição (ID do jogo) com a chave AES e IV
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

$requestPayload = json_decode($decryptedRequestDataJson, true);
if (!$requestPayload || !isset($requestPayload['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Formato inválido do payload da requisição.']);
    exit;
}

$id = intval($requestPayload['id']); //

if ($id <= 0) { //
    $responsePayload = json_encode(['erro' => 'ID do jogo inválido.']); //
} else {
    require_once 'conexao.php'; //

    // Buscar dados do jogo
    $stmt = $con->prepare("SELECT * FROM jogos WHERE id = ?"); //
    $stmt->bind_param("i", $id); //
    $stmt->execute(); //
    $result = $stmt->get_result(); //
    $jogo = $result->fetch_assoc(); //
    $stmt->close(); //

    if (!$jogo) { //
        // Se o jogo não for encontrado, ainda envie uma resposta criptografada
        $responsePayload = json_encode(["erro" => "Jogo não encontrado."]); //
    } else {
        // Buscar requisitos do sistema
        $stmtReq = $con->prepare("SELECT * FROM requisitos_sistema WHERE id_jogo = ?"); //
        $stmtReq->bind_param("i", $id); //
        $stmtReq->execute(); //
        $resultReq = $stmtReq->get_result(); //

        $requisitos_minimos = ""; //
        $requisitos_recomendados = ""; //

        while ($req = $resultReq->fetch_assoc()) { //
            $texto = //
                "SO: {$req['so']}\n" . //
                "Processador: {$req['processador']}\n" . //
                "Memória: {$req['memoria']}\n" . //
                "Placa de Vídeo: {$req['placa_video']}\n" . //
                "Armazenamento: {$req['armazenamento']}"; //

            if ($req['tipo'] === 'minimos') { //
                $requisitos_minimos = $texto; //
            } elseif ($req['tipo'] === 'recomendados') { //
                $requisitos_recomendados = $texto; //
            }
        }
        $stmtReq->close(); //

        // Adiciona os requisitos ao array do jogo
        $jogo['requisitos_minimos'] = $requisitos_minimos; //
        $jogo['requisitos_recomendados'] = $requisitos_recomendados; //
        $responsePayload = json_encode($jogo); //
    }
}


// 🔐 Criptografar a resposta (dados do jogo ou erro) com a mesma chave AES da requisição
$encryptedJogoData = openssl_encrypt(
    $responsePayload,
    'aes-128-cbc',
    $requestAesKey, // Usar a mesma chave AES da requisição do cliente
    OPENSSL_RAW_DATA,
    $requestIv      // Usar o mesmo IV da requisição do cliente
);

if ($encryptedJogoData === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Falha ao criptografar os dados de resposta.']);
    exit;
}

// Retornar apenas os dados do jogo criptografados. O cliente já tem a AES key e IV para descriptografar.
echo json_encode([
    'encryptedJogoData' => base64_encode($encryptedJogoData)
]);
$con->close(); //
?>