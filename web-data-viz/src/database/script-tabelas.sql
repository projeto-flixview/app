CREATE DATABASE IF NOT EXISTS flixview;
-- DROP DATABASE flixview;
USE flixview;

CREATE TABLE cargo (
    idCargo CHAR(8) PRIMARY KEY,
    nomeCargo VARCHAR(50)
);

INSERT INTO cargo (idCargo, nomeCargo) VALUES
('USER0001', 'Usuário Comum'),
('DATA0001', 'Analista de Dados de Conteúdo'),
('ADMIN001', 'Administrador');

CREATE TABLE usuario ( 
    idUsuario INT PRIMARY KEY AUTO_INCREMENT, 
    nome VARCHAR(100) NOT NULL, 
    email VARCHAR(150) NULL, 
    senha VARCHAR(50) NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    modified_at TIMESTAMP,
    modified_by VARCHAR(50),
    idCargo CHAR(8) NOT NULL,
    CONSTRAINT fk_cargo_usuario
        FOREIGN KEY (idCargo)
        REFERENCES cargo(idCargo)
);

CREATE TABLE configSlack (
	idConfig INT PRIMARY KEY AUTO_INCREMENT,
    slack BOOL,
    telegram BOOL,
    teams BOOL,
    javaMail BOOL,
    idUser INT,
    CONSTRAINT fk_usuario_configSlack
    FOREIGN KEY (idUser) REFERENCES usuario(idUsuario)
);

CREATE TABLE titulo (
    idTitulo INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200),
    original_title VARCHAR(200),
    original_language VARCHAR(200),
    director VARCHAR(50),
    cast TEXT,
    duration INT,
    episodes INT,
    seasons INT,
    overview TEXT,
    popularity DECIMAL(10,2),
    poster_path VARCHAR(300),    
    release_date DATE,
    vote_average DECIMAL(3,1),
    vote_count INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    modified_at TIMESTAMP,
    modified_by VARCHAR(50)
);

CREATE TABLE genero (
    idGenero INT PRIMARY KEY,
    nome VARCHAR(100)
);

INSERT INTO genero (idGenero, nome) VALUES
(1, 'Thriller'),
(2, 'Drama'),
(3, 'Crime'),
(4, 'Romance'),
(5, 'Fantasia'),
(6, 'Animação'),
(7, 'Família'),
(8, 'Ficção científica'),
(9, 'Aventura'),
(10, 'Ação'),
(11, 'Comédia'),
(12, 'Terror'),
(13, 'Música'),
(14, 'Mistério'),
(15, 'Guerra'),
(16, 'Faroeste'),
(17, 'História'),
(18, 'Documentário'),
(19, 'Cinema TV'),
(20, 'Action & Adventure'),
(21, 'Reality'),
(22, 'Kids'),
(23, 'Sci-Fi & Fantasy'),
(24, 'War & Politics'),
(25, 'Soap'),
(26, '10749'),
(27, 'Talk');

CREATE TABLE review (
    idReview INT PRIMARY KEY AUTO_INCREMENT,
    author VARCHAR(100),
    content VARCHAR(600),
    rating VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    modified_at TIMESTAMP,
    modified_by VARCHAR(50),
    fkUsuario INT,
    fkTitulo INT,
    CONSTRAINT fk_review_usuario
        FOREIGN KEY (fkUsuario)
        REFERENCES usuario(idUsuario),
    CONSTRAINT fk_review_titulo
        FOREIGN KEY (fkTitulo)
        REFERENCES titulo(idTitulo)
);

CREATE TABLE titulo_genero (
    fkTitulo INT,
    fkGenero INT,
    PRIMARY KEY (fkTitulo, fkGenero),
    CONSTRAINT fk_titulo_genero_titulo
        FOREIGN KEY (fkTitulo)
        REFERENCES titulo(idTitulo),
    CONSTRAINT fk_titulo_genero_genero
        FOREIGN KEY (fkGenero)
        REFERENCES genero(idGenero)
);

CREATE TABLE tipoLog (
	idLog INT PRIMARY KEY auto_increment,
    tipo VARCHAR(25)
);

INSERT INTO tipoLog (tipo) VALUES
	('Sucesso'),
	('Leitura'),
	('Inserção'),
	('Erro'),
	('Info');

CREATE TABLE log_Java (
	id INT PRIMARY KEY AUTO_INCREMENT,
    msg TEXT,
    statusLog VARCHAR(25),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    source VARCHAR(50),
    typeLog INT,
    CONSTRAINT fk_log
    FOREIGN KEY (typeLog) REFERENCES tipoLog(idLog)
);

