function enviar(){

    var form = document.getElementById('formulario');

    var dados = new FormData(form);




    fetch("../php/teste.php", {
        method: "POST",
        body: dados
    });
}