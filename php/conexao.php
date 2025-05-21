<?php
require_once __DIR__ . '/config.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$host = $_ENV['DB_HOST'];
$user = $_ENV['DB_USER'];
$pass = $_ENV['DB_PASS'];
$db   = $_ENV['DB_NAME'];

$con = new mysqli($host, $user, $pass, $db);

if ($con->connect_error) { 
    die("Erro na conexão: " . $con->connect_error);
}
?>
