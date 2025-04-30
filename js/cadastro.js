function cadastrar() {
    let usuario = document.getElementById("username").value;
    let nome_completo = document.getElementById("nome_completo").value;
    let email = document.getElementById("email").value;
    let cpf = document.getElementById("cpf").value;
    let telefone = document.getElementById("telefone").value;
    let senha = document.getElementById("senha").value;
    let confirmarSenha = document.getElementById("confirmarSenha").value;

    // Biblioteca do CRYPTOJS
    let hashSenha = CryptoJS.SHA256(senha).toString();
    let hashConfirmarSenha = CryptoJS.SHA256(confirmarSenha).toString();

    // EXPRESSÕES REGULARES
    let regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    let regexCPF = /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/;
    let regexTelefone = /^\(\d{2}\)\s?(9\s?\d{4}|\d{4})-\d{4}$/;
    let regexSenha = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[$*&@#!.])[0-9a-zA-Z$*&@#!.]{8,}$/;

    if (usuario == ""){
        window.alert("Usuário não pode estar vazio!");
        return;
    }

    if (nome_completo == ""){
        window.alert("Nome Completo não pode estar vazio!");
        return;
    }

        // Validando email
    if (regexEmail.test(email) == false) {
        window.alert("Email precisa ser válido (EX: teste@dominio.com)");
        return;
    }

    // Validando CPF
    if (regexCPF.test(cpf) == false) {
        window.alert("CPF apenas nesse formato -> xxx.xxx.xxx-xx");
        return;
    }

    // Validando telefone
    if (regexTelefone.test(telefone) == false) {
        window.alert("Telefone apenas nesses formato -> (xx) 9xxxx-xxxx, (xx) 9 xxxx-xxxx, (xx) xxxx-xxxx ou ");
        return;
    }

    // Validando senha
    if (regexSenha.test(senha) == false) {
        window.alert("A senha precisa ter no mínimo 8 caracteres, entre eles, 1 número , 1 letra maiúscula e 1 símbolo.");
        return;
    }

    // Verificando se as senhas são iguais
    if (hashSenha !== hashConfirmarSenha) {
        window.alert("As senhas não são iguais.");
        return;
    }



    //ENVIAR PARA O PHP VIA POST
    var form = document.getElementById('formulario');
    
    var dados = new FormData(form);


    dados.set("senha", hashSenha);
    dados.set("confirmarSenha", hashConfirmarSenha);
    
    
    fetch("../php/envio_email.php", {
        method: "POST",
        body: dados
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            alert("E-mail de verificação enviado! Verifique sua caixa de entrada.");
            window.location.href = "../html/login.html";
        } else {
            alert("Erro ao enviar e-mail: " + data.message);
        }
    })
    .catch(error => {
        alert("Erro na requisição: " + error);
    });
    

}
