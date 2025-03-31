<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '../PHPMAILER-master/src/Exception.php';
require '../PHPMAILER-master/src/PHPMailer.php';
require '../PHPMAILER-master/src/SMTP.php';

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
    $mail->addAddress('zavpowiski@gmail.com', ''); // E-mail do usuário

    // Assunto e corpo do e-mail
    $subject = "Verifique seu E-mail";
    $verificationLink = "http://localhost/jogos/definitivo/php/confirmar_email.php?email=" . urlencode('zavpowiski@gmail.com');        // Link de verificação

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




?>
