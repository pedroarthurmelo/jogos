window.onload = function () {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get("email");

    if (email) {
        fetch(`../php/confirmar_email.php?email=${encodeURIComponent(email)}`)
            .then((res) => res.json())
            .then((data) => {
                const msgElement = document.getElementById("mensagem");
                msgElement.textContent = data.mensagem;
                if (data.status === "erro") {
                    msgElement.style.color = "red";
                } else {
                    msgElement.style.color = "green";
                }
            })
            .catch(() => {
                document.getElementById("mensagem").textContent = "Erro ao conectar com o servidor.";
            });
    } else {
        document.getElementById("mensagem").textContent = "E-mail não fornecido.";
    }
};
