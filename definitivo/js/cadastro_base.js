function validarCampos() {
    let nome = document.getElementById("nome-completo").value.trim();
    let email = document.getElementById("email").value.trim();
    let cpf = document.getElementById("cpf").value.trim();
    let telefone = document.getElementById("telefone").value.trim();
    let senha = document.getElementById("password").value;
    let confirmSenha = document.getElementById("confirmPassword").value;

    // Regex corrigidos
    let regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Validação correta de e-mail
    let regexCPF = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/; // Formato: xxx.xxx.xxx-xx
    let regexTelefone = /^\(\d{2}\) \d{5}-\d{4}$/; // Formato: (xx) xxxxx-xxxx
    let regexSenha = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/; // Pelo menos 8 caracteres, uma letra e um número

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

    console.log("Hash da senha: ", hash)

    alert("Cadastro validado com sucesso!");
}

// Formatação automática do CPF
function formatarCPF(input) {
    let cpf = input.value.replace(/\D/g, ""); // Remove tudo que não for número
    cpf = cpf.replace(/^(\d{3})(\d)/, "$1.$2");
    cpf = cpf.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    cpf = cpf.replace(/\.(\d{3})(\d)/, ".$1-$2");
    input.value = cpf;
}

// Formatação automática do telefone
function formatarTelefone(input) {
    let telefone = input.value.replace(/\D/g, ""); // Remove tudo que não for número
    telefone = telefone.replace(/^(\d{2})(\d)/, "($1) $2");
    telefone = telefone.replace(/(\d{5})(\d)/, "$1-$2");
    input.value = telefone;
}
