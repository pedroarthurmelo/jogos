// Conteúdo para ../js/verificar_sessao.js

/**
 * Verifica a sessão do usuário.
 * @param {boolean} isInitialCheck - True se for a primeira verificação ao carregar a página.
 */
function verificarSessao(isInitialCheck = false) {
    fetch('../php/verificar_sessao.php', { cache: 'no-store' }) // Evitar cache
        .then(response => {
            if (!response.ok) {
                throw new Error('Falha na rede ou erro no servidor: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'expirado' || data.status === 'nao_logado_redirect') {
                if (data.redirect_url) {
                    window.location.href = data.redirect_url;
                } else {
                    window.location.href = '../html/login.html?reason=fallback_redirect';
                }
            } else if (data.status === 'logado') {
                if (isInitialCheck) {
                    console.log('Sessão verificada e válida. Usuário:', data.user_id);
                    // Lógica adicional após login confirmado pode vir aqui (ex: carregar dados da página)
                }
            } else {
                console.warn('Status de sessão desconhecido:', data.status);
                if (isInitialCheck) {
                    window.location.href = '../html/login.html?reason=unknown_status';
                }
            }
        })
        .catch(error => {
            console.error('Erro crítico ao verificar a sessão:', error);
            if (isInitialCheck) {
                window.location.href = '../html/login.html?reason=session_check_failed';
            }
        });
}


// 1. VERIFICAÇÃO INICIAL:
verificarSessao(true);


const TEMPO_VERIFICACAO_PERIODICA = 1000;
setInterval(() => {
    verificarSessao(false);
}, TEMPO_VERIFICACAO_PERIODICA);

