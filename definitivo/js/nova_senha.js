function getEmailFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('email');
}

function atualizarSenha() {
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    const email = getEmailFromURL();

    const regexSenha = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[$*&@#!.])[0-9a-zA-Z$*&@#!.]{8,}$/;

    if (!regexSenha.test(senha)) {
        alert("A senha precisa ter no mínimo 8 caracteres, incluindo 1 número, 1 letra maiúscula e 1 símbolo.");
        return;
    }

    if (senha !== confirmarSenha) {
        alert("As senhas não coincidem.");
        return;
    }

    const hashSenha = CryptoJS.SHA256(senha).toString();

    let formData = new FormData();
    formData.append('email', email);
    formData.append('novaSenha', hashSenha);

    fetch('../php/atualizar_senha.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            alert("Senha atualizada com sucesso!");
            window.location.href = '../html/login.html';
        } else {
            alert("Erro: " + data.message);
        }
    })
    .catch(err => {
        console.error("Erro:", err);
        alert("Erro ao atualizar a senha.");
    });
}