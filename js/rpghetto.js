// RPGhetto.js - Gestion des badges et défis mensuels

// Configuration des badges (à étendre plus tard)
const BADGES_CONFIG = {
    bonus: [
        // Badges bonus à venir
    ]
};

// Configuration des défis mensuels
const MONTHLY_CHALLENGES = [
    {
        id: 'ruin-starbucks',
        icon: '☕',
        title: 'Ruin Starbucks !',
        description: 'N\'achète pas de café à l\'extérieur, même au bureau. Privilégie ton thermos !',
        target: 30, // jours sans café extérieur
        unit: 'jours'
    },
    {
        id: 'one-mistake-per-day',
        icon: '🛒',
        title: '1 Bêtise par Jour',
        description: 'Un achat non essentiel par jour MAXIMUM. Pas plus !',
        target: 31, // max 1 par jour
        unit: 'achats'
    },
    {
        id: 'uber-fear',
        icon: '🍝',
        title: 'Uber T\'as Peur',
        description: 'On ne commande pas à manger. Des pâtes et basta !',
        target: 30, // jours sans commande
        unit: 'jours'
    }
];

// Initialisation de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 RPGhetto page loaded');
    
    // Initialiser les statistiques
    updateBadgeStats();
    
    // Charger les badges (pour l'instant, juste les placeholders)
    loadBadges();
    
    // Charger les défis mensuels
    loadMonthlyChallenges();
});

// Fonction pour charger les badges
function loadBadges() {
    const bonusGrid = document.getElementById('bonus-badges-grid');
    
    // Pour l'instant, on garde les placeholders
    // Plus tard, on pourra ajouter des badges réels ici
    
    console.log('📛 Badges loaded (placeholders for now)');
}

// Fonction pour charger les défis mensuels
function loadMonthlyChallenges() {
    const challengesGrid = document.getElementById('challenges-grid');
    
    if (!challengesGrid) return;
    
    // Vider la grille
    challengesGrid.innerHTML = '';
    
    // Générer les défis pour le mois actuel
    MONTHLY_CHALLENGES.forEach(challenge => {
        const challengeElement = createChallengeElement(challenge);
        challengesGrid.appendChild(challengeElement);
    });
    
    console.log('🎯 Monthly challenges loaded');
}

// Fonction pour créer un élément de défi
function createChallengeElement(challenge) {
    const challengeDiv = document.createElement('div');
    challengeDiv.className = 'challenge-card';
    challengeDiv.dataset.challengeId = challenge.id;
    
    // Calculer le progrès (pour l'instant, valeurs aléatoires pour la démo)
    const currentProgress = Math.floor(Math.random() * challenge.target);
    const progressPercentage = Math.min((currentProgress / challenge.target) * 100, 100);
    const isCompleted = currentProgress >= challenge.target;
    const isFailed = false; // À implémenter plus tard
    
    let statusText = `${currentProgress}/${challenge.target} ${challenge.unit}`;
    let statusClass = '';
    
    if (isCompleted) {
        statusText = '✅ Défi réussi !';
        statusClass = 'completed';
    } else if (isFailed) {
        statusText = '❌ Défi échoué';
        statusClass = 'failed';
    }
    
    challengeDiv.innerHTML = `
        <div class="challenge-icon">${challenge.icon}</div>
        <h3 class="challenge-title">${challenge.title}</h3>
        <p class="challenge-description">${challenge.description}</p>
        <div class="challenge-progress">
            <div class="progress-bar" style="width: ${progressPercentage}%"></div>
        </div>
        <div class="challenge-status ${statusClass}">${statusText}</div>
    `;
    
    return challengeDiv;
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

// Fonction pour vérifier si les défis doivent être régénérés (nouveau mois)
function checkAndRegenerateChallenges() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const lastChallengeDate = localStorage.getItem('lastChallengeDate');
    
    if (lastChallengeDate) {
        const lastDate = new Date(lastChallengeDate);
        const lastMonth = lastDate.getMonth();
        const lastYear = lastDate.getFullYear();
        
        // Si c'est un nouveau mois, régénérer les défis
        if (currentMonth !== lastMonth || currentYear !== lastYear) {
            localStorage.setItem('lastChallengeDate', currentDate.toISOString());
            loadMonthlyChallenges();
            console.log('🔄 Challenges regenerated for new month');
        }
    } else {
        // Première visite
        localStorage.setItem('lastChallengeDate', currentDate.toISOString());
    }
}

// Vérifier les défis au chargement
document.addEventListener('DOMContentLoaded', function() {
    checkAndRegenerateChallenges();
});

// Export des fonctions pour utilisation dans d'autres fichiers
window.RPGhetto = {
    addBadge,
    updateBadgeStats,
    calculateTotalScore,
    loadMonthlyChallenges,
    checkAndRegenerateChallenges
}; 