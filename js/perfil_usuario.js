function carregarDadosUsuario() {
    fetch('../php/perfil_usuario.php')
    .then(response => response.json())
    .then(data => {
        console.log('Dados do usuário:', data); // Para depuração no console
        if (data.status === 'ok') {
            // Verifica se os elementos existem antes de alterar o texto
            const nomeElem = document.getElementById('nomeUsuario');
            const emailElem = document.getElementById('emailUsuario');
            const dataRegistroElem = document.getElementById('dataRegistro');

            if (nomeElem) nomeElem.textContent = data.usuario.username || 'Nome não disponível';
            if (emailElem) emailElem.textContent = data.usuario.email || 'Email não disponível';
            if (dataRegistroElem) dataRegistroElem.textContent = data.usuario.data_registro || 'Data não disponível';
        } else {
            console.error('Erro:', data.mensagem);
            alert('Erro ao carregar dados do usuário: ' + data.mensagem);
            // Aqui você pode redirecionar para a página de login, se quiser
            // window.location.href = '../html/login.html';
        }
    })
    .catch(error => {
        console.error('Erro ao carregar perfil:', error);
        alert('Erro na comunicação com o servidor.');
    });
}

// Chama a função para carregar os dados ao carregar a página
document.addEventListener('DOMContentLoaded', carregarDadosUsuario);
