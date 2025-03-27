function registrar(){
    let senha = document.getElementById("password").value;
    let hash = CryptoJS.SHA256(senha).toString();
    window.alert("Cadastro Realizado com Sucesso");
    console.log("Hash Gerado", hash);


    if (senha < 8){
        window.alert("A senha deve ser maior que 8 caracteres!")
    }
}
