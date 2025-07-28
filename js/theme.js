// Gestion centralisée du thème pour FCKNGMoney

// Fonction pour basculer entre les thèmes
function toggleTheme() {
    // Vérifier si l'utilisateur veut passer en mode clair
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
        // L'utilisateur veut passer en mode clair
        if (!canUseLightMode()) {
            showLightModeLockedNotification();
            return;
        }
    }
    
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Appliquer le nouveau thème
    html.setAttribute('data-theme', newTheme);
    
    // Sauvegarder la préférence
    localStorage.setItem('fckngmoney_theme', newTheme);
    
    // Mettre à jour le bouton
    updateThemeButton();
    
    console.log(`🎨 Thème basculé vers: ${newTheme}`);
}

// Fonction pour vérifier si l'utilisateur peut utiliser le mode clair
function canUseLightMode() {
    // Si l'utilisateur n'est pas connecté, autoriser le mode clair
    if (!window.authService || !window.authService.isUserAuthenticated()) {
        return true;
    }
    
    // Récupérer le niveau de l'utilisateur depuis le localStorage
    const user = window.authService.getCurrentUser();
    const userLevelKey = `userLevel_${user.email}`;
    const userLevel = parseInt(localStorage.getItem(userLevelKey)) || 1;
    
    // Si on n'a pas le niveau dans le localStorage, essayer de le calculer
    if (userLevel === 1) {
        // Calculer le niveau basé sur les dépenses (logique similaire à rpghetto.js)
        const storageKey = `expenses_${user.email}`;
        const expenses = JSON.parse(localStorage.getItem(storageKey)) || [];
        
        // Calculer le score total
        let totalScore = 0;
        
        // Points des badges (logique simplifiée)
        if (expenses.length > 0) {
            totalScore += Math.min(expenses.length * 10, 500); // Max 500 points pour les dépenses
        }
        
        // Calculer le niveau basé sur le score
        const calculatedLevel = Math.floor(totalScore / 100) + 1;
        
        // Sauvegarder le niveau calculé
        localStorage.setItem(userLevelKey, calculatedLevel.toString());
        
        return calculatedLevel >= 5;
    }
    
    return userLevel >= 5;
}

// Fonction pour afficher la notification de verrouillage du mode clair
function showLightModeLockedNotification() {
    // Créer la notification si elle n'existe pas
    let notification = document.getElementById('light-mode-locked-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'light-mode-locked-notification';
        notification.className = 'light-mode-locked-notification';
        notification.innerHTML = `
            <div class="light-mode-locked-content">
                <div class="light-mode-locked-icon">🔒</div>
                <div class="light-mode-locked-text">
                    <h3>Mode Clair Verrouillé</h3>
                    <p>Tu dois atteindre le niveau 5 pour débloquer le mode clair !</p>
                    <p>Continue à gérer ton budget pour progresser !</p>
                </div>
            </div>
        `;
        document.body.appendChild(notification);
    }
    
    // Afficher la notification
    notification.classList.add('show');
    
    // Masquer la notification après 4 secondes
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// Fonction pour mettre à jour le bouton de thème
function updateThemeButton() {
    const themeButton = document.querySelector('.user-menu-option.theme-toggle');
    if (!themeButton) return;
    
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const icon = themeButton.querySelector('.icon');
    const text = themeButton.querySelector('.theme-text');
    
    // Vérifier si l'utilisateur peut utiliser le mode clair
    const canUseLight = canUseLightMode();
    
    if (currentTheme === 'light') {
        icon.textContent = '🌙';
        text.textContent = 'Passer en mode sombre';
        themeButton.classList.remove('locked');
        themeButton.onclick = toggleTheme;
    } else {
        if (canUseLight) {
            icon.textContent = '☀️';
            text.textContent = 'Passer en mode clair';
            themeButton.classList.remove('locked');
            themeButton.onclick = toggleTheme;
        } else {
            icon.textContent = '🔒';
            text.textContent = 'Mode clair (Niveau 5 requis)';
            themeButton.classList.add('locked');
            themeButton.onclick = showLightModeLockedNotification;
        }
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
window.canUseLightMode = canUseLightMode;
window.showLightModeLockedNotification = showLightModeLockedNotification; 