<?php
// Defina o Content-Type como texto puro
header("Content-Type: text/plain");

// Caminho da chave pública
$publicKeyPath = __DIR__ . '/public.pem';

if (!file_exists($publicKeyPath)) {
    http_response_code(500);
    echo "Erro: Chave pública não encontrada.";
    exit;
}

echo file_get_contents($publicKeyPath);
?>
