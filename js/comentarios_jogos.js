document.querySelector('.botao-critica').addEventListener('click', () => {
        const critica = document.getElementById('criticaInput').value;
        const jogo = document.body.dataset.jogo; // pega o valor do atributo data-jogo

        fetch('../php/enviar_critica.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ critica, jogo })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                document.getElementById('criticaInput').value = '';
                carregarComentarios(); // Atualiza comentários automaticamente
            } else {
                alert(data.mensagem);
            }
        });
    });

    function carregarComentarios() {
        const jogo = document.body.dataset.jogo;

        fetch(`../php/obter_criticas.php?jogo=${encodeURIComponent(jogo)}`)
        .then(response => response.json())
        .then(data => {
            const comentariosDiv = document.getElementById('comentarios');
            comentariosDiv.innerHTML = '';
            data.forEach(c => {
                comentariosDiv.innerHTML += `
                    <h3>${c.username}:</h3>
                    <p>${c.texto}</p><br>
                `;
            });
        });
    }

    document.addEventListener('DOMContentLoaded', carregarComentarios);