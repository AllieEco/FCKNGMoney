// Gestion centralisée du thème pour FCKNGMoney

// Fonction pour basculer entre les thèmes
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Appliquer le nouveau thème
    html.setAttribute('data-theme', newTheme);
    
    // Sauvegarder la préférence
    localStorage.setItem('fckngmoney_theme', newTheme);
    
    // Mettre à jour le bouton
    updateThemeButton();
    
    console.log(`🎨 Thème basculé vers: ${newTheme}`);
}

// Fonction pour mettre à jour le bouton de thème
function updateThemeButton() {
    const themeButton = document.querySelector('.user-menu-option.theme-toggle');
    if (!themeButton) return;
    
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const icon = themeButton.querySelector('.icon');
    const text = themeButton.querySelector('.theme-text');
    
    if (currentTheme === 'light') {
        icon.textContent = '🌙';
        text.textContent = 'Passer en mode sombre';
    } else {
        icon.textContent = '☀️';
        text.textContent = 'Passer en mode clair';
    }
}

// Fonction pour initialiser le thème
function initTheme() {
    const savedTheme = localStorage.getItem('fckngmoney_theme');
    const html = document.documentElement;
    
    if (savedTheme) {
        html.setAttribute('data-theme', savedTheme);
    } else {
        // Par défaut, mode sombre
        html.setAttribute('data-theme', 'dark');
    }
    
    // Mettre à jour le bouton après l'initialisation
    setTimeout(updateThemeButton, 100);
}

// Initialiser le thème au chargement
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
});

// Exposer les fonctions globalement
window.toggleTheme = toggleTheme;
window.updateThemeButton = updateThemeButton;
window.initTheme = initTheme; 