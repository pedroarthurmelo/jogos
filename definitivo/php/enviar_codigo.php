<?php
include "conexao.php";
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '../PHPMAILER-master/src/Exception.php';
require '../PHPMAILER-master/src/PHPMailer.php';
require '../PHPMAILER-master/src/SMTP.php';

header("Content-Type: application/json");

$email = $_POST['email'] ?? '';

if (!$email) {
    echo json_encode(['status' => 'error', 'message' => 'E-mail não informado.']);
    exit;
}

// Verifica se o e-mail existe no banco
$sql = "SELECT * FROM usuarios WHERE email = '$email'";
$result = mysqli_query($con, $sql);

if (mysqli_num_rows($result) == 0) {
    echo json_encode(['status' => 'error', 'message' => 'E-mail não encontrado.']);
    exit;
}

$codigo = rand(100000, 999999);
$expiracao = date("Y-m-d H:i:s", strtotime("+10 minutes"));

// Armazena o código e a validade na tabela (você pode criar uma tabela de recuperação de senha)
mysqli_query($con, "INSERT INTO codigos_recuperacao (email, codigo, expiracao) VALUES ('$email', '$codigo', '$expiracao')");

// Enviar e-mail com PHPMailer
$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'pedroarthurmeloestudos@gmail.com';
    $mail->Password = 'rtfh edau lzdd xqiy'; // Senha de app
    $mail->SMTPSecure = 'ssl';
    $mail->Port = 465;

    $mail->setFrom('pedroarthurmeloestudos@gmail.com', 'Recuperação de Senha GameWorld');
    $mail->addAddress($email);

    $mail->Subject = "Código de Verificação";
    $mail->Body = "Seu código de verificação é: $codigo\nEste código expira em 10 minutos.";

    $mail->send();
    echo json_encode(['status' => 'success']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $mail->ErrorInfo]);
}
?>
