<?php
// Inclui os arquivos de configuração e conexão com o banco de dados
require_once __DIR__ . '/config.php';
require_once "conexao.php";

// Inclui as classes do PHPMailer para envio de e-mails
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '../PHPMAILER-master/src/Exception.php';
require '../PHPMAILER-master/src/PHPMailer.php';
require '../PHPMAILER-master/src/SMTP.php';

header('Content-Type: application/json');

// 1. Carregar a chave privada do servidor

$privateKey = file_get_contents('private.pem');
if (!$privateKey) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Falha ao carregar a chave privada do servidor.']);
    exit; 
}

// 2. Receber os dados criptografados e a chave de sessão criptografada do POST
$encryptedData = $_POST['dados'] ?? '';
$encryptedKey = $_POST['chave'] ?? '';  

// Verifica se os dados necessários foram realmente recebidos
if (empty($encryptedData) || empty($encryptedKey)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Dados criptografados incompletos.']);
    exit;
}

// 3. Descriptografar a chave AES e o IV (Vetor de Inicialização) usando a chave privada RSA
// Esta é a primeira etapa da descriptografia híbrida: usar RSA para obter a chave simétrica.
$decryptedKeyJson = '';
if (!openssl_private_decrypt(base64_decode($encryptedKey), $decryptedKeyJson, $privateKey)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Falha ao descriptografar a chave de sessão.']);
    exit;
}

// Decodificar o JSON da chave descriptografada para um array PHP
$keyData = json_decode($decryptedKeyJson, true);
// Verifica se o JSON foi decodificado corretamente e se contém as chaves 'chave' e 'iv'
if (!$keyData || !isset($keyData['chave']) || !isset($keyData['iv'])) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Pacote da chave de sessão inválido.']);
    exit;
}

// Converte as chaves AES e IV de formato hexadecimal para binário
// Isso é necessário porque CryptoJS.enc.Hex no JS as enviou como hex.
$aesKey = hex2bin($keyData['chave']);
$iv = hex2bin($keyData['iv']);

// 4. Descriptografar os dados do usuário usando a chave AES e o IV obtidos
// Esta é a segunda etapa da descriptografia híbrida: usar AES para obter os dados principais.
$decryptedJson = openssl_decrypt(
    base64_decode($encryptedData), // Os dados criptografados, decodificados de Base64
    'aes-128-cbc',                // Algoritmo e modo de operação (deve corresponder ao lado do cliente)
    $aesKey,                      // A chave AES que acabamos de descriptografar
    OPENSSL_RAW_DATA,             // Indica que a saída deve ser dados brutos (não Base64, etc.)
    $iv                            // O IV que acabamos de descriptografar
);

// Verifica se a descriptografia dos dados foi bem-sucedida
if ($decryptedJson === false) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Falha na descriptografia dos dados do usuário.']);
    exit;
}

// 5. Decodificar os dados do usuário de JSON para um array PHP
// Os dados foram enviados como uma string JSON criptografada.
$userData = json_decode($decryptedJson, true);
// Verifica se o JSON foi decodificado corretamente
if ($userData === null) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Os dados do usuário descriptografados não são um JSON válido.']);
    exit;
}

// --- FIM DA SEÇÃO DE DESCRIPTOGRAFIA ---


// --- INÍCIO DA LÓGICA DE CADASTRO E ENVIO DE E-MAIL ---

// Extrair os dados do array $userData descriptografado
$username = $userData["username"];
$nome_completo = $userData["nome_completo"];
$email = $userData["email"];
$cpf = $userData["cpf"];
$telefone = $userData["telefone"];
$senha = $userData["senha"]; // A senha já chega como um hash SHA-256 do lado do cliente
$token_ativacao = bin2hex(random_bytes(50)); // Gera um token de ativação único
$status = 'pendente'; // Define o status inicial do usuário como 'pendente'

// 6. Preparar e executar a inserção dos dados no banco de dados
// Usando prepared statements para prevenir ataques de SQL Injection.
$query = "INSERT INTO usuarios (username, nome_completo, email, cpf, telefone, senha, token_ativacao, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = mysqli_prepare($con, $query); // Prepara a consulta SQL

// Verifica se a preparação da consulta falhou
if (!$stmt) {
    echo json_encode(['status' => 'error', 'message' => 'Erro na preparação da consulta SQL.']);
    exit;
}

// Liga os parâmetros (valores) à consulta preparada
// "ssssssss" indica que todos os 8 parâmetros são strings.
mysqli_stmt_bind_param($stmt, "ssssssss", $username, $nome_completo, $email, $cpf, $telefone, $senha, $token_ativacao, $status);

// Executa a consulta preparada
if (mysqli_stmt_execute($stmt)) {
    // 7. Enviar e-mail de verificação usando PHPMailer
    $mail = new PHPMailer(true); // Cria uma nova instância do PHPMailer

    try {
        // Configurações do SMTP (Protocolo de Transferência de Correio Simples)
        $mail->isSMTP(); // Habilita o uso de SMTP
        $mail->Host       = $_ENV['MAIL_HOST'];       // Servidor SMTP (ex: smtp.gmail.com)
        $mail->SMTPAuth   = true;                     // Habilita autenticação SMTP
        $mail->Username   = $_ENV['MAIL_USERNAME'];   // Usuário SMTP
        $mail->Password   = $_ENV['MAIL_PASSWORD'];   // Senha SMTP
        $mail->SMTPSecure = $_ENV['MAIL_ENCRYPTION']; // Habilita criptografia TLS/SSL
        $mail->Port       = (int) $_ENV['MAIL_PORT']; // Porta SMTP (ex: 587 para TLS, 465 para SSL)
        $mail->CharSet    = 'UTF-8';                   // Define o conjunto de caracteres para UTF-8

        // Remetente e Destinatário do e-mail
        $mail->setFrom($_ENV['MAIL_FROM'], $_ENV['MAIL_FROM_NAME']); // Endereço e nome do remetente
        $mail->addAddress($email); // Adiciona o destinatário (o e-mail do usuário cadastrado)

        // Conteúdo do e-mail
        $mail->isHTML(true); // Define o formato do e-mail como HTML
        $mail->Subject = "Verifique seu E-mail para ativar sua conta"; // Assunto do e-mail
        // Monta o link de verificação, incluindo o e-mail e o token de ativação
        $verificationLink = "http://localhost/jogos/html/confirmar_email.html?email=" . urlencode($email). "&token=$token_ativacao";

        // Corpo do e-mail em HTML
        $htmlContent = "
        <html>
            <body>
                <p>Olá, $nome_completo! Clique no botão abaixo para verificar seu e-mail e ativar sua conta na GameWorld:</p>
                <a href='$verificationLink' style='background-color:rgb(7, 154, 154); color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; border-radius: 8px;'>Confirmar E-mail</a>
                <p>Se você não se cadastrou, por favor, ignore este e-mail.</p>
            </body>
        </html>
        ";
        $mail->Body = $htmlContent; // Define o corpo HTML do e-mail
        // Corpo do e-mail em texto puro, para clientes que não suportam HTML
        $mail->AltBody = "Olá, $nome_completo! Para verificar seu e-mail, por favor, acesse o seguinte link: $verificationLink";

        $mail->send(); // Envia o e-mail
        // Se o e-mail for enviado com sucesso, retorna um status de sucesso
        echo json_encode(['status' => 'success']);
    } catch (Exception $e) {
        // Se houver um erro no envio do e-mail, retorna um status de erro,
        // mas informa que o usuário foi cadastrado, já que a inserção no DB teve sucesso.
        echo json_encode(['status' => 'error', 'message' => 'Usuário cadastrado, mas falha ao enviar e-mail de verificação. Erro: ' . $mail->ErrorInfo]);
    }
} else {
    // Se a inserção no banco de dados falhar
    if (mysqli_errno($con) == 1062) { // 1062 é o código de erro para "Duplicate entry" (entrada duplicada)
        // Significa que o nome de usuário ou e-mail já existe
        echo json_encode(['status' => 'error', 'message' => 'O nome de usuário ou e-mail já está em uso.']);
    } else {
        // Outro erro de banco de dados
        echo json_encode(['status' => 'error', 'message' => 'Erro ao cadastrar usuário no banco de dados.']);
    }
}

// 8. Fechar o statement e a conexão com o banco de dados
// Libera os recursos do banco de dados.
mysqli_stmt_close($stmt);
mysqli_close($con);

?>