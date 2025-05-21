-- para criar um novo usuário
CREATE USER 'usuario123'@'localhost' IDENTIFIED BY 'senha123';

-- para colocar as permissões no usuário
GRANT SELECT, INSERT, UPDATE, DELETE ON criticajogos.* TO 'usuario123'@'localhost';

-- atualizar permissoes
FLUSH PRIVILEGES;

-- para ver os usuarios existentes
SELECT User, Host FROM mysql.user;

-- para apagar um usuario
DROP USER 'usuario123'@'localhost';

-- ver as regras dele
SHOW GRANTS FOR 'usuario123'@'localhost';

-- para ver o usuário cadastrado neste exato momento
SELECT USER(), CURRENT_USER();


-- criar o banco de dados
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
    token_ativacao VARCHAR(100),
    google_2fa_secret VARCHAR(32),
    2fa_confirmado TINYINT(1) DEFAULT 0,
    data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pendente', 'ativo') DEFAULT 'pendente'

);

CREATE TABLE codigos_recuperacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    expiracao DATETIME NOT NULL,
    FOREIGN KEY (email) REFERENCES usuarios(email) ON DELETE CASCADE
);

CREATE TABLE criticas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    jogo VARCHAR(100) NOT NULL,
    texto TEXT NOT NULL,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);




