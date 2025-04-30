function enviarCodigo() {
    const email = document.getElementById('email').value;

    if (!email) {
        alert("Por favor, preencha o e-mail.");
        return;
    }

    let formData = new FormData();
    formData.append('email', email);

    fetch('../php/enviar_codigo.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "success") {
            alert("Código enviado com sucesso! Verifique seu e-mail.");
            window.location.href = `../html/validar_codigo.html?email=${encodeURIComponent(email)}`;
        } else {
            alert("Erro: " + data.message);
        }
    })
    .catch(err => {
        console.error("Erro:", err);
        alert("Erro na solicitação. Tente novamente.");
    });
}