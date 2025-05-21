<?php
require_once __DIR__ . '/vendor/autoload.php'; // Ajuste o caminho conforme sua estrutura

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__); // Caminho da pasta onde está o .env
$dotenv->load();
