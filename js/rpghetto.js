// RPGhetto.js - Gestion des badges et statistiques

// Configuration des badges (à étendre plus tard)
const BADGES_CONFIG = {
    bonus: [
        // Badges bonus à venir
    ]
};

// Initialisation de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 RPGhetto page loaded');
    
    // Initialiser les statistiques
    updateBadgeStats();
    
    // Charger les badges (pour l'instant, juste les placeholders)
    loadBadges();
});

// Fonction pour charger les badges
function loadBadges() {
    const bonusGrid = document.getElementById('bonus-badges-grid');
    
    // Pour l'instant, on garde les placeholders
    // Plus tard, on pourra ajouter des badges réels ici
    
    console.log('📛 Badges loaded (placeholders for now)');
}

// Fonction pour mettre à jour les statistiques des badges
function updateBadgeStats() {
    const bonusCount = document.getElementById('bonus-badges-count');
    const totalScore = document.getElementById('total-badge-score');
    
    // Pour l'instant, on met des valeurs par défaut
    // Plus tard, on calculera ces valeurs basées sur les badges obtenus
    
    bonusCount.textContent = '0';
    totalScore.textContent = '0';
    
    console.log('📊 Badge stats updated');
}

// Fonction pour ajouter un badge (à utiliser plus tard)
function addBadge(badgeData) {
    const grid = document.getElementById('bonus-badges-grid');
    
    if (grid) {
        const badgeElement = createBadgeElement(badgeData);
        grid.appendChild(badgeElement);
        
        // Mettre à jour les statistiques
        updateBadgeStats();
        
        console.log('🏆 Badge bonus added:', badgeData);
    }
}

// Fonction pour créer un élément de badge
function createBadgeElement(badgeData) {
    const badgeDiv = document.createElement('div');
    badgeDiv.className = 'badge-placeholder';
    badgeDiv.innerHTML = `
        <div class="badge-icon">${badgeData.icon}</div>
        <h3>${badgeData.title}</h3>
        <p>${badgeData.description}</p>
    `;
    
    return badgeDiv;
}

// Fonction pour calculer le score total (à implémenter plus tard)
function calculateTotalScore() {
    // Logique pour calculer le score basé sur les badges obtenus
    return 0;
}

// Export des fonctions pour utilisation dans d'autres fichiers
window.RPGhetto = {
    addBadge,
    updateBadgeStats,
    calculateTotalScore
}; 