function registrar() {
    let usuario = document.getElementById("username").value;
    let nome_completo = document.getElementById("nome_completo").value;
    let email = document.getElementById("email").value;
    let cpf = document.getElementById("cpf").value;
    let telefone = document.getElementById("telefone").value;
    let senha = document.getElementById("senha").value;
    let confirmarSenha = document.getElementById("confirmarSenha").value;

    // Biblioteca do CRYPTOJS
    let hash = CryptoJS.SHA256(senha).toString();

    // EXPRESSÕES REGULARES
    let regexUsuario = /^[a-zA-Z0-9]+(?:[a-zA-Z0-9]*[-._]?[a-zA-Z0-9]+)*$/
    // let regexNomeCompleto = /[]/
    let regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    let regexCPF = /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/;
    let regexTelefone = /^\([1-9]{2}\)\s?9?\s?[0-9]{4}-[0-9]{4}$/;
    let regexSenha = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[$*&@#!.])[0-9a-zA-Z$*&@#!.]{8,}$/;

    if (regexUsuario.test(usuario) == false){
        window.alert("Precisa de pelo menos 1 digito o usuário");
        return;
    }

    // if (regexNomeCompleto.test(nome_completo) == false){
    //     window.alert("Precisa de pelo menos 1 LETRA");
    //     return;
    // }

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
        window.alert("Telefone apenas nesse formato -> (xx) xxxxx-xxxx");
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

    var form = document.getElementById('formulario');
    
    var dados = new FormData(form);
    
    
    fetch("../php/insere-cadastro.php", {
            method: "POST",
            body: dados
        });
    

}
