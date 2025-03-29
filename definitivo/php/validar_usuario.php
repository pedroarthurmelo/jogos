<?php
// Recebe os dados do usuário via POST

// Recebe os dados do usuário via POST
$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username']; // A chave que estamos esperando é 'username', que é o nome de usuário

// Caminho para o arquivo JSON onde os dados dos usuários estão armazenados
$file = 'usuarios.json';

// Verifica se o arquivo existe
if (!file_exists($file)) {
    echo json_encode(['status' => 'error', 'message' => 'Usuário não encontrado']);
    exit;
}

// Lê os dados do arquivo JSON
$usuarios = json_decode(file_get_contents($file), true);

// Busca o usuário pelo e-mail (chave do JSON)
$userFound = null;
foreach ($usuarios as $email => $user) {
    if ($user['username'] === $username) {
        $userFound = $user;
        break;
    }
}

if ($userFound) {
    // Verificando se a senha está correta
    if (CryptoJS.SHA256($data['senha']).toString() !== $userFound['senha']) {
        echo json_encode(['status' => 'error', 'message' => 'Senha incorreta']);
        exit;
    }

    // Verificando se o e-mail está confirmado
    if (!$userFound['email_confirmado']) {
        echo json_encode(['status' => 'error', 'message' => 'E-mail não confirmado']);
        exit;
    }

    echo json_encode(['status' => 'success', 'usuario' => $userFound]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Usuário não encontrado']);
}




?>
