document.getElementById("formulario").addEventListener("submit", function(event) {
    event.preventDefault();

    let senha = document.getElementById("senha").value;
    let hashedPassword = CryptoJS.SHA256(senha).toString(); // Gera hash antes do envio

    let formData = new FormData(this);
    formData.set("senha", hashedPassword);

    fetch("../php/login.php", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.status === "success") {
            window.location.href = "dashboard.html"; // Redireciona após login
        }
    })
    .catch(error => console.error("Erro:", error));
});
