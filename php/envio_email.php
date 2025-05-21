<?php
require_once __DIR__ . '/config.php';
require_once "conexao.php";

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '../PHPMAILER-master/src/Exception.php';
require '../PHPMAILER-master/src/PHPMailer.php';
require '../PHPMAILER-master/src/SMTP.php';

$username = $_POST["username"];
$nome_completo = $_POST["nome_completo"];
$email = $_POST["email"];
$cpf = $_POST["cpf"];
$telefone = $_POST["telefone"];
$senha = $_POST["senha"];
$token_ativacao = bin2hex(random_bytes(50));
$status = 'pendente';

// Utilizando prepared statements para a inserção dos dados no banco de dados
$query = "INSERT INTO usuarios (username, nome_completo, email, cpf, telefone, senha, token_ativacao, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
$stmt = mysqli_prepare($con, $query);
mysqli_stmt_bind_param($stmt, "ssssssss", $username, $nome_completo, $email, $cpf, $telefone, $senha, $token_ativacao, $status);

if (mysqli_stmt_execute($stmt)) {
    $mail = new PHPMailer(true);

    try {
        // Configurações do SMTP com dados do .env
        $mail->isSMTP();
        $mail->Host       = $_ENV['MAIL_HOST'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $_ENV['MAIL_USERNAME'];
        $mail->Password   = $_ENV['MAIL_PASSWORD'];
        $mail->SMTPSecure = $_ENV['MAIL_ENCRYPTION'];
        $mail->Port       = (int) $_ENV['MAIL_PORT'];

        // Remetente
        $mail->setFrom($_ENV['MAIL_FROM'], $_ENV['MAIL_FROM_NAME']);

        // Destinatário
        $mail->addAddress($email);

        // Assunto e corpo do e-mail
        $subject = "Verifique seu E-mail";
        $verificationLink = "http://localhost/jogos/html/confirmar_email.html?email=" . urlencode($email). "&token=$token_ativacao";

        $htmlContent = "
        <html>
            <body>
                <p>Olá! Clique no botão abaixo para verificar seu e-mail e ativar sua conta:</p>
                <a href='$verificationLink' style='background-color:rgb(7, 154, 154); color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; border-radius: 8px;'>Confirmar E-mail</a>
            </body>
        </html>
        ";

        $mail->Subject = $subject;
        $mail->msgHTML($htmlContent);

        $mail->send();
        echo json_encode(['status' => 'success']);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => $mail->ErrorInfo]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Erro ao cadastrar usuário.']);
}

mysqli_stmt_close($stmt);
?>
