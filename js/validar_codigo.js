function getEmailFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('email');
}

function validarCodigo() {
    const codigo = document.getElementById('codigo').value;
    const email = getEmailFromURL();

    if (!codigo) {
        alert("Por favor, preencha o código.");
        return;
    }

    let formData = new FormData();
    formData.append('codigo', codigo);
    formData.append('email', email);

    fetch('../php/validar_codigo.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "success") {
            alert("Código verificado com sucesso!");
            window.location.href = `../html/nova_senha.html?email=${encodeURIComponent(email)}`;
        } else {
            alert("Erro: " + data.message);
        }
    })
    .catch(err => {
        console.error("Erro:", err);
        alert("Erro na solicitação. Tente novamente.");
    });
}