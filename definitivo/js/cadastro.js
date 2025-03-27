function registrar(){
    let senha = document.getElementById("password").value;
    let hash = CryptoJS.SHA256(senha).toString();
    window.alert("Cadastro Realizado com Sucesso");
    console.log("HASH TEste", hash);
}
