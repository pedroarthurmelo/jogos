function validarCampos() {
    let nome = document.getElementById("nome-completo").value.trim();
    let email = document.getElementById("email").value.trim();
    let cpf = document.getElementById("cpf").value.trim();
    let telefone = document.getElementById("telefone").value.trim();
    let senha = document.getElementById("password").value;
    let confirmSenha = document.getElementById("confirmPassword").value;

    let regexEmail = //ver na sala
    let regexCPF = //ver na sala
    let regexTelefone = //ver na sala
    let regexSenha = //ver na sala

    if (nome.length < 3) {
        alert("Nome deve ter pelo menos 3 caracteres.");
        return false;
    }
    if (!regexEmail.test(email)) {
        alert("E-mail inválido.");
        return false;
    }
    if (!regexCPF.test(cpf)) {
        alert("CPF inválido. Use o formato xxx.xxx.xxx-xx");
        return false;
    }
    if (!regexTelefone.test(telefone)) {
        alert("Telefone inválido. Use o formato (xx) xxxxx-xxxx");
        return false;
    }
    if (!regexSenha.test(senha)) {
        alert("A senha deve ter pelo menos 8 caracteres, uma letra e um número.");
        return false;
    }
    if (senha !== confirmSenha) {
        alert("As senhas não coincidem.");
        return false;
    }
    return true;
}

function registrar() {
    if (!validarCampos()) {
        return;
    }
    
    let senha = document.getElementById("password").value;
    let hash = CryptoJS.SHA256(senha).toString();
    
    var form = document.getElementById("formulario");
    var dados = newFormData(form);
    dados.set("password", hash);

    fetch("../php/insere-cadastro.php", {
        method: "POST",
        body: dados
    })
    .then(response => response.text())
    .then(data => {
        alert("Cadastro realizado com sucesso!");
        window.location.href = "../html/login.html";
    })
    .catch(error => {
        console.error("Erro ao cadastrar:", error);
    });
}
