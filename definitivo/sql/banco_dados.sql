DROP DATABASE IF EXISTS criticajogos;
CREATE DATABASE criticajogos;
USE criticajogos;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    nome_completo VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    cpf VARCHAR(14) NOT NULL UNIQUE, 
    telefone VARCHAR(20) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    confirmar_senha VARCHAR(255) NOT NULL,
    token_ativacao VARCHAR(100),
    status ENUM('pendente', 'ativo') DEFAULT 'pendente'
);
