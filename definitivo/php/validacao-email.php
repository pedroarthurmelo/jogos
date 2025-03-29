<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '../PHPMAILER-master/src/Exception.php';
require '../PHPMAILER-master/src/PHPMailer.php';
require '../PHPMAILER-master/src/SMTP.php';

// Recebe os dados da requisição
$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'];

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'error', 'message' => 'Email inválido']);
    exit;
}

$mail = new PHPMailer(true);

try {
    // Configurações do SMTP com SSL explícito
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'pedroarthurmeloestudos@gmail.com'; // Sua conta de e-mail
    $mail->Password = 'rtfh edau lzdd xqiy'; // Senha do app Gmail
    $mail->SMTPSecure = 'ssl'; // Usando SSL
    $mail->Port = 465;

    // Remetente
    $mail->setFrom('pedroarthurmeloestudos@gmail.com', 'Nome do Nosso Site');

    // Destinatário
    $mail->addAddress($email); // E-mail do usuário

    // Assunto e corpo do e-mail
    $subject = "Verifique seu E-mail";
    $verificationLink = "http://localhost/jogos/definitivo/php/confirmar_email.php?email=" . urlencode($email);        // Link de verificação

    // Criando o botão HTML para o e-mail
    $htmlContent = "
    <html>
        <body>
            <p>Olá! Clique no botão abaixo para verificar seu e-mail e ativar sua conta:</p>
            <a href='$verificationLink' style='background-color: #4CAF50; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; border-radius: 8px;'>Confirmar E-mail</a>
        </body>
    </html>
    ";

    $mail->Subject = $subject;
    $mail->msgHTML($htmlContent); // Definindo o corpo do e-mail em HTML

    // Enviar o e-mail
    $mail->send();
    echo json_encode(['status' => 'success']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $mail->ErrorInfo]);
}

// Recebe os dados do usuário via POST
$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'];

// Caminho para o arquivo JSON onde os dados dos usuários serão armazenados
$file = 'usuarios.json';

// Verificando se o arquivo existe, caso contrário, criamos um arquivo vazio
if (!file_exists($file)) {
    file_put_contents($file, json_encode([])); // Cria o arquivo com um array vazio
}

// Lê os dados existentes dos usuários
$usuarios = json_decode(file_get_contents($file), true);

// Verifica se o usuário já está cadastrado
if (isset($usuarios[$email])) {
    echo json_encode(['status' => 'error', 'message' => 'Usuário já cadastrado!']);
    exit;
}

// Dados do novo usuário
$usuarios[$email] = [
    'username' => $usuario,
    'email' => $email,
    'cpf' => $data['cpf'],
    'telefone' => $data['telefone'],
    'senha' => $data['senha'], // Aqui seria o hash da senha
    'email_confirmado' => false
];

// Atualiza o arquivo JSON com os dados do novo usuário
file_put_contents($file, json_encode($usuarios));

echo json_encode(['status' => 'success', 'message' => 'Cadastro realizado com sucesso!']);


?>
