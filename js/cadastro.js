document.addEventListener('DOMContentLoaded', () => {
    let encryptor;
    let proximaAcao = null;

    // 1. Buscar chave pública no servidor ao carregar a página
    fetch('../php/get_public_key.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Falha ao carregar a chave pública.');
            }
            return response.text();
        })
        .then(publicKey => {
            encryptor = new JSEncrypt();
            encryptor.setPublicKey(publicKey);
        })
        .catch(error => {
            console.error(error);
            mostrarAlerta('Erro crítico: Não foi possível carregar a chave de segurança. Tente recarregar a página.');
        });

    // Função para exibir alertas personalizados
    function mostrarAlerta(mensagem, aoConfirmar = null) {
        document.getElementById("mensagemAlerta").textContent = mensagem;
        document.getElementById("alertaPersonalizado").style.display = "block";
        document.getElementById("fundoBloqueador").style.display = "block";
        document.body.style.overflow = "hidden";
        proximaAcao = aoConfirmar;
    }

    // Função global para fechar o alerta
    window.fecharAlerta = function() {
        document.getElementById("alertaPersonalizado").style.display = "none";
        document.getElementById("fundoBloqueador").style.display = "none";
        document.body.style.overflow = "auto";
        if (typeof proximaAcao === "function") {
            proximaAcao();
            proximaAcao = null;
        }
    }

    // Captura o evento de submit do formulário
    document.getElementById('formularioCadastro').addEventListener('submit', async function(e) {
        e.preventDefault(); // Impede o envio padrão do formulário

        if (!encryptor) {
            mostrarAlerta('A chave de segurança ainda não foi carregada. Por favor, aguarde um momento e tente novamente.');
            return;
        }

        // Validação dos campos
        let usuario = document.getElementById("username").value;
        let nome_completo = document.getElementById("nome_completo").value;
        let email = document.getElementById("email").value;
        let cpf = document.getElementById("cpf").value;
        let telefone = document.getElementById("telefone").value;
        let senha = document.getElementById("senha").value;
        let confirmarSenha = document.getElementById("confirmarSenha").value;

        let regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        let regexCPF = /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/;
        let regexTelefone = /^\(\d{2}\)\s?(9\s?\d{4}|\d{4})-\d{4}$/;
        let regexSenha = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[$*&@#!.])[0-9a-zA-Z$*&@#!.]{8,}$/;

        if (!usuario || !nome_completo || !email || !cpf || !telefone || !senha) {
            mostrarAlerta("Todos os campos devem ser preenchidos!");
            return;
        }
        if (!regexEmail.test(email)) {
            mostrarAlerta("Email precisa ser válido (EX: teste@dominio.com)");
            return;
        }
        if (!regexCPF.test(cpf)) {
            mostrarAlerta("CPF apenas nesse formato -> xxx.xxx.xxx-xx");
            return;
        }
        if (!regexTelefone.test(telefone)) {
            mostrarAlerta("Telefone apenas nesses formatos -> (xx) 9xxxx-xxxx ou (xx) xxxx-xxxx");
            return;
        }
        if (!regexSenha.test(senha)) {
            mostrarAlerta("A senha precisa ter no mínimo 8 caracteres, 1 número, 1 letra maiúscula e 1 símbolo ($*&@#!.).");
            return;
        }
        if (senha !== confirmarSenha) {
            mostrarAlerta("As senhas não são iguais.");
            return;
        }

        // Criptografa a senha com SHA256 antes de enviar
        let hashSenha = CryptoJS.SHA256(senha).toString();

        // 2. Montar objeto com os dados
        const dadosUsuario = {
            username: usuario,
            nome_completo: nome_completo,
            email: email,
            cpf: cpf,
            telefone: telefone,
            senha: hashSenha 
        };

        // 3. Gerar chave AES e IV aleatórios
        const chaveAES = CryptoJS.lib.WordArray.random(16); // 128 bits
        const iv = CryptoJS.lib.WordArray.random(16);

        // 4. Criptografar os dados do usuário (em formato JSON) com AES
        const dadosJson = JSON.stringify(dadosUsuario);
        const dadosCriptografados = CryptoJS.AES.encrypt(dadosJson, chaveAES, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }).toString();

        // 5. Montar pacote da chave (AES + IV) e criptografar com RSA
        const pacoteChave = JSON.stringify({
            chave: chaveAES.toString(CryptoJS.enc.Hex),
            iv: iv.toString(CryptoJS.enc.Hex)
        });
        const chaveCriptografada = encryptor.encrypt(pacoteChave);

        if (!chaveCriptografada) {
            mostrarAlerta('Erro na criptografia da chave de segurança. Não foi possível enviar os dados.');
            return;
        }

        // 6. Enviar dados criptografados ao servidor
        const formData = new FormData();
        formData.append('dados', dadosCriptografados);
        formData.append('chave', chaveCriptografada);

        try {
            const response = await fetch("../php/envio_email.php", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (data.status === "success") {
                mostrarAlerta("E-mail de verificação enviado! Verifique sua caixa de entrada.", () => {
                    window.location.href = "../html/login.html";
                });
            } else {
                mostrarAlerta("Erro ao processar cadastro: " + data.message);
            }
        } catch (error) {
            mostrarAlerta("Erro na requisição: " + error);
        }
    });

    // Bloqueador de eventos de teclado quando o alerta está ativo
    document.addEventListener("keydown", function(e) {
        const alerta = document.getElementById("alertaPersonalizado");
        if (alerta && alerta.style.display === "block") {
            if (e.key !== "Enter") {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }, true);
});