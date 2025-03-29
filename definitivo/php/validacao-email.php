<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMAILER-master/src/Exception.php';
require 'PHPMAILER-master/src/PHPMailer.php';
require 'PHPMAILER-master/src/SMTP.php';

$mail = new PHPMailer(true); // Passando o true para ativar exceções

try {
    // Configurações do SMTP
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'pedroarthurmeloestudos@gmail.com'; // CONTA Q EU VOU ENVIAR 
    $mail->Password = 'rtfh edau lzdd xqiy'; // Usar senha de app do Gmail
    $mail->SMTPSecure = 'ssl'; 
    $mail->Port = 465;
    $mail->CharSet = 'UTF-8';

    // Remetente
    $mail->setFrom('pedroarthurmelomeloestudos@gmail.com', 'NOME DO NOSSO SITE'); // AQUI É O NOSSO EMAIL

    // Destinatário
    $mail->addAddress('zavpowiski@gmail.com', 'PEDRO'); // EMAIL DE DESTINO

    // Assunto e corpo do e-mail
    $mail->Subject = "Assunto do E-mail";
    $mail->msgHTML("TESTANDO MENSAGEM 123 123");

    // Enviar e-mail
    $mail->send();
    echo 'Mensagem enviada com sucesso!';
} catch (Exception $e) {
    echo "Erro ao enviar mensagem: {$mail->ErrorInfo}";
}

?>
