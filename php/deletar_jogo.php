<?php
session_start();
require_once 'conexao.php'; // conexão com o banco

header('Content-Type: application/json'); //

// Carregar chave privada do servidor
$privateKey = file_get_contents('private.pem');
if (!$privateKey) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Falha ao carregar a chave privada do servidor.']);
    exit;
}

$encryptedData = $_POST['encryptedData'] ?? '';
$encryptedKey = $_POST['encryptedKey'] ?? '';

if (empty($encryptedData) || empty($encryptedKey)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Dados incompletos.']);
    exit;
}

// 1. Descriptografar a chave AES (e IV) da requisição com a chave privada RSA do servidor
$decryptedRequestKeyJson = '';
if (!openssl_private_decrypt(base64_decode($encryptedKey), $decryptedRequestKeyJson, $privateKey)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Falha na descriptografia da chave de sessão da requisição.']);
    exit;
}

$requestKeyData = json_decode($decryptedRequestKeyJson, true);
if (!$requestKeyData || !isset($requestKeyData['key']) || !isset($requestKeyData['iv'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Formato inválido da chave de sessão da requisição.']);
    exit;
}

$requestAesKey = hex2bin($requestKeyData['key']);
$requestIv = hex2bin($requestKeyData['iv']);

// 2. Descriptografar os dados da requisição (ID do jogo a ser deletado) com a chave AES e IV
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
    echo json_encode(['status' => 'error', 'message' => 'Falha na descriptografia dos dados da requisição.']);
    exit;
}

$requestPayload = json_decode($decryptedRequestDataJson, true);
if (!$requestPayload || !isset($requestPayload['id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Formato inválido do payload da requisição.']);
    exit;
}

$id = intval($requestPayload['id']); //

if ($id <= 0) { //
    $responsePayload = json_encode(['sucesso' => false, 'mensagem' => 'ID do jogo inválido.']); //
} else {
    // Iniciar uma transação para garantir a integridade dos dados
    mysqli_begin_transaction($con);

    try {
        // Deletar registros relacionados na tabela 'criticas'
        $stmtCriticas = $con->prepare("DELETE FROM criticas WHERE id_jogo = ?");
        $stmtCriticas->bind_param("i", $id);
        $stmtCriticas->execute();
        $stmtCriticas->close();

        // Deletar registros relacionados na tabela 'requisitos_sistema'
        $stmtRequisitos = $con->prepare("DELETE FROM requisitos_sistema WHERE id_jogo = ?");
        $stmtRequisitos->bind_param("i", $id);
        $stmtRequisitos->execute();
        $stmtRequisitos->close();

        // Finalmente, deletar o jogo da tabela 'jogos'
        $stmtJogo = $con->prepare("DELETE FROM jogos WHERE id = ?"); //
        $stmtJogo->bind_param("i", $id); //
        
        if ($stmtJogo->execute()) { //
            if ($stmtJogo->affected_rows > 0) { //
                mysqli_commit($con); // Confirma a transação se tudo deu certo
                $responsePayload = json_encode(['sucesso' => true, 'mensagem' => 'Jogo deletado com sucesso!']); //
            } else {
                mysqli_rollback($con); // Reverte se nenhum jogo foi afetado (não encontrado)
                $responsePayload = json_encode(['sucesso' => false, 'mensagem' => 'Jogo não encontrado para deletar.']); //
            }
        } else {
            mysqli_rollback($con); // Reverte em caso de erro na execução do delete do jogo
            $responsePayload = json_encode(['sucesso' => false, 'mensagem' => 'Erro ao deletar jogo: ' . $stmtJogo->error]); //
        }
        $stmtJogo->close(); //

    } catch (Exception $e) {
        mysqli_rollback($con); // Reverte em caso de qualquer exceção
        $responsePayload = json_encode(['sucesso' => false, 'mensagem' => 'Erro interno ao deletar jogo: ' . $e->getMessage()]);
    }
}

// 🔐 Criptografar a resposta (sucesso/erro) com a mesma chave AES da requisição
$encryptedResponse = openssl_encrypt(
    $responsePayload,
    'aes-128-cbc',
    $requestAesKey, // Usar a mesma chave AES da requisição do cliente
    OPENSSL_RAW_DATA,
    $requestIv      // Usar o mesmo IV da requisição do cliente
);

if ($encryptedResponse === false) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Falha ao criptografar a resposta.']);
    exit;
}

echo json_encode([
    'encryptedResponse' => base64_encode($encryptedResponse)
]);
?>