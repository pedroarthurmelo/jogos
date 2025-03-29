<?php
// Recebe o e-mail via GET
$email = $_GET['email'];

// Verifica se o e-mail é válido
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo "E-mail inválido!";
    exit;
}

// Caminho do arquivo JSON onde os dados dos usuários estão armazenados
$file = 'usuarios.json';
$usuarios = json_decode(file_get_contents($file), true);

// Verifica se o usuário existe no arquivo
if (isset($usuarios[$email])) {
    // Marca o e-mail como confirmado
    $usuarios[$email]['email_confirmado'] = true;
    
    // Atualiza o arquivo JSON com a confirmação do e-mail
    file_put_contents($file, json_encode($usuarios));

    echo "E-mail de verificação confirmado! Agora você pode fazer login.";
} else {
    echo "Usuário não encontrado!";
}
?>
