<?php
// Recebe os dados do usuário via POST
$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'];

// Caminho para o arquivo JSON onde os dados dos usuários estão armazenados
$file = 'usuarios.json';

// Verifica se o arquivo existe
if (!file_exists($file)) {
    echo json_encode(['status' => 'error', 'message' => 'Usuário não encontrado']);
    exit;
}

// Lê os dados do arquivo JSON
$usuarios = json_decode(file_get_contents($file), true);

// Verifica se o usuário existe
if (isset($usuarios[$email])) {
    echo json_encode(['status' => 'success', 'usuario' => $usuarios[$email]]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Usuário não encontrado']);
}
?>
