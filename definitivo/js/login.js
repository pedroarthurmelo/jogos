function login() {
    let username = document.getElementById("username").value; // Supondo que o "username" seja o email
    let senha = document.getElementById("senha").value;

    // Validações de entrada
    if (!username || !senha) {
        window.alert("Por favor, preencha todos os campos.");
        return;
    }

    // Fazendo a requisição ao servidor para verificar o usuário
    fetch('../php/validar_usuario.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username})
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'error') {
            window.alert(data.message);
            return;
        }

        // Verificando se a senha está correta
        let usuario = data.usuario;
        if (CryptoJS.SHA256(senha).toString() !== usuario.senha) {
            window.alert("Senha incorreta.");
            return;
        }

        // Verificando se o e-mail está confirmado
        if (!usuario.email_confirmado) {
            window.alert("Você precisa confirmar seu e-mail antes de fazer login.");
            return;
        }

        // Se tudo estiver correto
        window.alert("Login bem-sucedido!");
        window.location.href = "../html/dashboard.html"; // Redireciona para a dashboard
    })
    .catch(error => {
        console.error('Erro:', error);
        window.alert('Erro ao processar seu login. Tente novamente.');
    });
}
