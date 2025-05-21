<?php
require_once __DIR__ . '/config.php'; // carrega variáveis do .env
require_once "conexao.php";

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

// Verifica se o e-mail existe no banco com prepared statement
$sql = "SELECT * FROM usuarios WHERE email = ?";
$stmt = mysqli_prepare($con, $sql);
mysqli_stmt_bind_param($stmt, "s", $email);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

if (mysqli_num_rows($result) == 0) {
    echo json_encode(['status' => 'error', 'message' => 'E-mail não encontrado.']);
    exit;
}
mysqli_stmt_close($stmt);

// Gera código e validade
$codigo = rand(100000, 999999);
$expiracao = date("Y-m-d H:i:s", strtotime("+10 minutes"));

// Armazena o código usando prepared statement
$insertSql = "INSERT INTO codigos_recuperacao (email, codigo, expiracao) VALUES (?, ?, ?)";
$insertStmt = mysqli_prepare($con, $insertSql);
mysqli_stmt_bind_param($insertStmt, "sis", $email, $codigo, $expiracao);
mysqli_stmt_execute($insertStmt);
mysqli_stmt_close($insertStmt);

// Enviar e-mail com PHPMailer
$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = $_ENV['MAIL_HOST'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $_ENV['MAIL_USERNAME'];
    $mail->Password   = $_ENV['MAIL_PASSWORD'];
    $mail->SMTPSecure = $_ENV['MAIL_ENCRYPTION'];
    $mail->Port       = (int) $_ENV['MAIL_PORT'];

    $mail->setFrom($_ENV['MAIL_FROM'], $_ENV['MAIL_FROM_NAME']);
    $mail->addAddress($email);

    $mail->Subject = "Código de Verificação";
    $mail->Body = "Seu código de verificação é: $codigo\nEste código expira em 10 minutos.";

    $mail->send();
    echo json_encode(['status' => 'success']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $mail->ErrorInfo]);
}
?>
