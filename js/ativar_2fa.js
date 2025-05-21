document.addEventListener('DOMContentLoaded', () => {
    fetch('../php/ativar_2fa.php')
        .then(response => response.json())
        .then(data => {
            if (data.qrCodeUrl) {
                document.getElementById('qrcode').innerHTML = `<img src="${data.qrCodeUrl}" alt="QR Code" class="qrcode">`;
                document.getElementById('codigo').innerHTML = `Ou insira manualmente: <strong>${data.secret}</strong>`;
            } else if (data.message) {
                document.getElementById('qrcode').innerHTML = `<p>${data.message}</p>`;
            } else {
                document.getElementById('qrcode').innerHTML = `<p>Erro ao gerar QR Code.</p>`;
            }
        })
        .catch(() => {
            document.getElementById('qrcode').innerHTML = `<p>Falha ao carregar o QR Code.</p>`;
        });
});
