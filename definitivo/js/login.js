function login() {
    let usuario = document.getElementById("username").value; // Captura o nome de usuário
    let senha = document.getElementById("senha").value;

    // Validações de entrada
    if (!usuario || !senha) {
        window.alert("Por favor, preencha todos os campos.");
        return;
    }

    // Fazendo a requisição ao servidor para verificar o usuário
    fetch('../php/validar_usuario.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: usuario }) // Envia o nome de usuário para o servidor
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'error') {
            window.alert(data.message);
            return;
        }

        // Verificando se a senha está correta
        let usuarioData = data.usuario;
        if (CryptoJS.SHA256(senha).toString() !== usuarioData.senha) {
            window.alert("Senha incorreta.");
            return;
        }

        // Verificando se o e-mail está confirmado
        if (!usuarioData.email_confirmado) {
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
