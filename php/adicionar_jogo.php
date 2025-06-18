<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["sucesso" => false, "mensagem" => "Acesso negado. Faça login."]);
    exit;
}

require_once 'conexao.php'; 

// --- START DECRYPTION SECTION ---

// 1. Load the private key from the server
$privateKey = file_get_contents('private.pem'); // Make sure this path is correct
if (!$privateKey) {
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Falha ao carregar a chave privada do servidor.']);
    exit;
}

// 2. Receive the encrypted data and encrypted session key from POST
$encryptedData = $_POST['dados'] ?? '';
$encryptedKey = $_POST['chave'] ?? '';

if (empty($encryptedData) || empty($encryptedKey)) {
    http_response_code(400);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Dados criptografados incompletos.']);
    exit;
}

// 3. Decrypt the AES key and IV using the RSA private key
$decryptedKeyJson = '';
if (!openssl_private_decrypt(base64_decode($encryptedKey), $decryptedKeyJson, $privateKey)) {
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Falha ao descriptografar a chave de sessão.']);
    exit;
}

$keyData = json_decode($decryptedKeyJson, true);
if (!$keyData || !isset($keyData['chave']) || !isset($keyData['iv'])) {
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Pacote da chave de sessão inválido.']);
    exit;
}

$aesKey = hex2bin($keyData['chave']);
$iv = hex2bin($keyData['iv']);

// 4. Decrypt the user data using the obtained AES key and IV
$decryptedJson = openssl_decrypt(
    base64_decode($encryptedData),
    'aes-128-cbc',
    $aesKey,
    OPENSSL_RAW_DATA,
    $iv
);

if ($decryptedJson === false) {
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Falha na descriptografia dos dados do jogo.']);
    exit;
}

// 5. Decode the game data from JSON to a PHP array
$gameData = json_decode($decryptedJson, true);
if ($gameData === null) {
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Os dados do jogo descriptografados não são um JSON válido.']);
    exit;
}

// Extract data from the decrypted $gameData array
$nome = $gameData['nome'] ?? '';
$sinopse = $gameData['sinopse'] ?? '';
$criadora = $gameData['criadora'] ?? '';
$generos = $gameData['generos'] ?? '';
$plataformas = $gameData['plataformas'] ?? '';
$avaliacao = $gameData['avaliacao'] ?? null;
$data_lancamento = $gameData['data_lancamento'] ?? null;

// Requisitos Mínimos
$min_so = $gameData['min_so'] ?? '';
$min_processador = $gameData['min_processador'] ?? '';
$min_memoria = $gameData['min_memoria'] ?? '';
$min_placa_video = $gameData['min_placa_video'] ?? '';
$min_armazenamento = $gameData['min_armazenamento'] ?? '';

// Requisitos Recomendados
$rec_so = $gameData['rec_so'] ?? '';
$rec_processador = $gameData['rec_processador'] ?? '';
$rec_memoria = $gameData['rec_memoria'] ?? '';
$rec_placa_video = $gameData['rec_placa_video'] ?? '';
$rec_armazenamento = $gameData['rec_armazenamento'] ?? '';

// --- END DECRYPTION SECTION ---


// Array de campos obrigatórios (using the decrypted data)
$required_fields = [
    'nome' => $nome,
    'sinopse' => $sinopse,
    'criadora' => $criadora,
    'generos' => $generos,
    'plataformas' => $plataformas,
    'min_so' => $min_so,
    'min_processador' => $min_processador,
    'min_memoria' => $min_memoria,
    'min_placa_video' => $min_placa_video,
    'min_armazenamento' => $min_armazenamento,
    'rec_so' => $rec_so,
    'rec_processador' => $rec_processador,
    'rec_memoria' => $rec_memoria,
    'rec_placa_video' => $rec_placa_video,
    'rec_armazenamento' => $rec_armazenamento
];

// Validação de campos de texto
foreach ($required_fields as $field_name => $field_value) {
    if (empty(trim($field_value))) {
        echo json_encode(["sucesso" => false, "mensagem" => "Por favor, preencha todos os campos. O campo '" . $field_name . "' está vazio."]);
        exit;
    }
}

// Validação específica para 'avaliacao' (pode ser null, mas se fornecido deve ser numérico)
if (!is_null($avaliacao) && !is_numeric($avaliacao)) {
    echo json_encode(["sucesso" => false, "mensagem" => "A avaliação deve ser um número válido."]);
    exit;
}

// Validação específica para 'data_lancamento' (pode ser null, mas se fornecido deve ser uma data válida)
if (!empty($data_lancamento) && !strtotime($data_lancamento)) {
    echo json_encode(["sucesso" => false, "mensagem" => "A data de lançamento não é válida."]);
    exit;
}

// --- Validação e Upload da Imagem (AGORA OBRIGATÓRIA) ---
$imagem_nome = null;
if (!isset($_FILES['imagem']) || $_FILES['imagem']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["sucesso" => false, "mensagem" => "Por favor, selecione uma imagem para o jogo."]);
    exit;
} else {
    $arquivo_tmp = $_FILES['imagem']['tmp_name'];
    $nome_arquivo = basename($_FILES['imagem']['name']);
    $extensao = strtolower(pathinfo($nome_arquivo, PATHINFO_EXTENSION));
    $extensoes_permitidas = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    if (!in_array($extensao, $extensoes_permitidas)) {
        echo json_encode(["sucesso" => false, "mensagem" => "Tipo de arquivo de imagem não permitido. Apenas JPG, JPEG, PNG, GIF e WEBP são aceitos."]);
        exit;
    }

    $pasta = '../imagens_jogos/';
    $novo_nome = uniqid('img_') . '.' . $extensao;
    $destino = $pasta . $novo_nome;

    if (!move_uploaded_file($arquivo_tmp, $destino)) {
        echo json_encode(["sucesso" => false, "mensagem" => "Erro ao salvar a imagem."]);
        exit;
    }

    $imagem_nome = $novo_nome;
}
// --- Fim da Validação e Upload da Imagem ---


// Inserir jogo
$stmt = $con->prepare("INSERT INTO jogos (nome, sinopse, criadora, generos, plataformas, avaliacao, data_lancamento, imagem) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

if (!$stmt) {
    echo json_encode(["sucesso" => false, "mensagem" => "Erro na preparação da query para jogos: " . $con->error]);
    exit;
}

$avaliacao_float = is_numeric($avaliacao) ? (float)$avaliacao : null;
$data_lancamento_str = !empty($data_lancamento) ? $data_lancamento : null;

$stmt->bind_param(
    "sssssdss",
    $nome,
    $sinopse,
    $criadora,
    $generos,
    $plataformas,
    $avaliacao_float,
    $data_lancamento_str,
    $imagem_nome
);

if ($stmt->execute()) {
    $id_jogo = $con->insert_id;

    // Inserção dos requisitos
    $stmt_requisitos = $con->prepare("INSERT INTO requisitos_sistema (id_jogo, tipo, so, processador, memoria, placa_video, armazenamento) VALUES (?, ?, ?, ?, ?, ?, ?)");

    if ($stmt_requisitos) {
        // Inserir mínimos
        $tipo = 'minimos';
        $stmt_requisitos->bind_param("issssss", $id_jogo, $tipo, $min_so, $min_processador, $min_memoria, $min_placa_video, $min_armazenamento);
        if (!$stmt_requisitos->execute()) {
            error_log("Erro ao inserir requisitos mínimos para o jogo ID {$id_jogo}: " . $stmt_requisitos->error);
        }

        // Inserir recomendados
        $tipo = 'recomendados';
        $stmt_requisitos->bind_param("issssss", $id_jogo, $tipo, $rec_so, $rec_processador, $rec_memoria, $rec_placa_video, $rec_armazenamento);
        if (!$stmt_requisitos->execute()) {
            error_log("Erro ao inserir requisitos recomendados para o jogo ID {$id_jogo}: " . $stmt_requisitos->error);
        }

        $stmt_requisitos->close();
    } else {
        error_log("Erro na preparação da query para requisitos: " . $con->error);
    }

    echo json_encode(["sucesso" => true, "mensagem" => "Jogo e requisitos adicionados com sucesso!"]);
} else {
    echo json_encode(["sucesso" => false, "mensagem" => "Erro ao adicionar jogo: " . $stmt->error]);
}

$stmt->close();
$con->close();
?>