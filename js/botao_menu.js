function toggleDropdown() {
    const dropdown = document.querySelector('.dropdown-content');
    dropdown.classList.toggle('active');
}

// Fecha o menu se clicar fora dele
window.addEventListener('click', function(event) {
    const dropdown = document.querySelector('.dropdown-content');
    if (!dropdown.contains(event.target) && !event.target.matches('.nav-user')) {
        dropdown.classList.remove('active');
    }
});

