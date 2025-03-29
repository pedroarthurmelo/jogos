function login() {
    let usuario = document.getElementById("usuario").value;
    let senha = document.getElementById("senha").value;

    if (usuario === "admin" && senha === "Senha123!") {
        alert("Login bem-sucedido!");
        window.location.href = "painel.html";
    } else {
        alert("Usuário ou senha incorretos.");
    }
}
