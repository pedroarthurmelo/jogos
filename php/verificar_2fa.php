<?php
session_start();
require_once __DIR__ . '/../2fa/vendor/autoload.php';
include '../php/conexao.php';

use Sonata\GoogleAuthenticator\GoogleAuthenticator;

header('Content-Type: application/json');

$user_id = $_SESSION['user_id'] ?? null;
$secret = $_SESSION['google_2fa_secret'] ?? null;

if (!$user_id || !$secret) {
    http_response_code(401);
    echo json_encode(['error' => 'Sessão inválida.']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$codigo = $data['codigo'] ?? '';

$g = new GoogleAuthenticator();
if ($g->checkCode($secret, $codigo, 0)) {
    $_SESSION['2fa_verificado'] = true;

    $stmt = $con->prepare("UPDATE usuarios SET 2fa_confirmado = 1 WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Código inválido ou expirado.']);
}
