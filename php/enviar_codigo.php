<?php
require_once __DIR__ . '/config.php'; // carrega variáveis do .env
require_once "conexao.php";

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '../PHPMAILER-master/src/Exception.php';
require '../PHPMAILER-master/src/PHPMailer.php';
require '../PHPMAILER-master/src/SMTP.php';

header("Content-Type: application/json");

// Carregar chave privada
$privateKey = file_get_contents('private.pem'); // Ensure this path is correct and secure
if (!$privateKey) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Falha ao carregar a chave privada do servidor.']);
    exit;
}

$encryptedEmail = $_POST['encryptedEmail'] ?? '';
$encryptedKey = $_POST['encryptedKey'] ?? '';

if (empty($encryptedEmail) || empty($encryptedKey)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Dados incompletos.']);
    exit;
}

// 1. Descriptografar a chave AES (e IV) com a chave privada RSA
$decryptedKeyJson = '';
if (!openssl_private_decrypt(base64_decode($encryptedKey), $decryptedKeyJson, $privateKey)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Falha na descriptografia da chave de sessão.']);
    exit;
}

$keyData = json_decode($decryptedKeyJson, true);
if (!$keyData || !isset($keyData['key']) || !isset($keyData['iv'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Formato inválido da chave de sessão.']);
    exit;
}

$aesKey = hex2bin($keyData['key']);
$iv = hex2bin($keyData['iv']);

// 2. Descriptografar o e-mail com a chave AES e IV
$decodedEncryptedEmail = base64_decode($encryptedEmail);
$decryptedEmailJson = openssl_decrypt(
    $decodedEncryptedEmail,
    'aes-128-cbc',
    $aesKey,
    OPENSSL_RAW_DATA,
    $iv
);

if ($decryptedEmailJson === false) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Falha na descriptografia do e-mail.']);
    exit;
}

$emailData = json_decode($decryptedEmailJson, true);
if (!$emailData || !isset($emailData['email'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Formato inválido dos dados do e-mail descriptografados.']);
    exit;
}

$email = $emailData['email']; // O e-mail descriptografado

// Agora, o restante do seu código para enviar o código...
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