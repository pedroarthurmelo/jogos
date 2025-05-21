document.getElementById('verificarForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const codigo = this.codigo.value;

    fetch('../php/verificar_2fa.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ codigo })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            window.location.href = '../html/tela_principal.html';
        } else {
            document.getElementById('mensagem').textContent = data.error || 'Erro ao verificar o código.';
        }
    })
    .catch(() => {
        document.getElementById('mensagem').textContent = 'Erro na requisição.';
    });
});
