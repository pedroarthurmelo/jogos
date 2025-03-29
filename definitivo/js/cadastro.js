function registrar() {
    let usuario = document.getElementById("username").value;
    let email = document.getElementById("email").value;
    let cpf = document.getElementById("cpf").value;
    let telefone = document.getElementById("telefone").value;
    let senha = document.getElementById("senha").value;
    let confirmarSenha = document.getElementById("confirmarSenha").value;

    // Biblioteca do CRYPTOJS
    let hash = CryptoJS.SHA256(senha).toString();

    // EXPRESSÕES REGULARES
    let regexUsuario = /^[a-zA-Z0-9]+(?:[a-zA-Z0-9]*[-._]?[a-zA-Z0-9]+)*$/
    let regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    let regexCPF = /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/;
    let regexTelefone = /^\([1-9]{2}\)\s?9?\s?[0-9]{4}-[0-9]{4}$/;
    let regexSenha = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[$*&@#!.])[0-9a-zA-Z$*&@#!.]{8,}$/;

    if (regexUsuario.test(usuario) == false){
        window.alert("Precisa de pelo menos 1 digito o usuário");
        return;
    }

    // Validando email
    if (regexEmail.test(email) == false) {
        window.alert("Email precisa ser válido (EX: teste@dominio.com)");
        return;
    }

    // Validando CPF
    if (regexCPF.test(cpf) == false) {
        window.alert("CPF PRECISA ESTAR NESSE FORMATO (xxx.xxx.xxx-xx)");
        return;
    }

    // Validando telefone
    if (regexTelefone.test(telefone) == false) {
        window.alert("Telefone precisa ser nesse formato (xx) xxxxx-xxxx");
        return;
    }

    // Validando senha
    if (regexSenha.test(senha) == false) {
        window.alert("A senha precisa ter mais que 8 dígitos, entre eles, 1 número , 1 letra maiúscula e 1 símbolo.");
        return;
    }

    // Verificando se as senhas são iguais
    if (senha !== confirmarSenha) {
        window.alert("As senhas não são iguais.");
        return;
    }

    // Dados para enviar ao servidor
    let dados = {
        usuario: usuario,
        email: email,
        cpf: cpf,
        telefone: telefone,
        senha: hash,
        email_confirmado: false  // Aqui você já envia o hash da senha
    };

    // Fazendo a requisição fetch para enviar os dados para o servidor
    fetch('../php/validacao-email.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro na resposta do servidor');
        }
        return response.json();
    })
    .then(data => {
        // Verifica se o cadastro foi realizado com sucesso
        if (data.status === 'success') {
            window.alert("Cadastro Realizado com Sucesso. Um e-mail de verificação foi enviado.");
            window.location.href = "../html/login.html";
        } else {
            window.alert("Erro no cadastro: " + data.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        window.alert('Houve um erro ao processar seu cadastro. Tente novamente.');
    });

    console.log('Enviando nome de usuário:', usuario);
}
