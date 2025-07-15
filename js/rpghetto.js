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
    
    // Vérifier si le défi a été complété
    const isCompleted = localStorage.getItem(`challenge_${challenge.id}_completed`) === 'true';
    const isFailed = localStorage.getItem(`challenge_${challenge.id}_failed`) === 'true';
    
    let statusText = 'Clique pour valider le défi';
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
        <div class="challenge-status ${statusClass}">${statusText}</div>
    `;
    
    // Ajouter l'événement de clic pour ouvrir la popup
    challengeDiv.addEventListener('click', () => {
        if (!isCompleted && !isFailed) {
            openChallengePopup(challenge);
        }
    });
    
    return challengeDiv;
}

// Fonction pour ouvrir la popup de confirmation
function openChallengePopup(challenge) {
    const popup = document.getElementById('challenge-popup');
    const successBtn = document.getElementById('challenge-success');
    const failBtn = document.getElementById('challenge-fail');
    const popupGif = document.getElementById('popup-gif');
    const popupQuestion = document.getElementById('popup-question');
    const popupButtons = document.getElementById('popup-buttons');

    // Réinitialiser le contenu de la popup
    popupGif.src = 'assets/images/cutecat.gif';
    popupGif.alt = 'Chat adorable';
    popupQuestion.textContent = 'Jure sur la tête de ce petit chat adorable que tu as réussi ce challenge !';
    popupButtons.style.display = 'flex';

    // Stocker l'ID du défi actuel
    popup.dataset.currentChallenge = challenge.id;

    // Afficher la popup
    popup.classList.add('active');

    // Gérer le clic sur "Je jure sur le chat"
    successBtn.onclick = () => {
        completeChallenge(challenge.id);
        // Afficher le racoon et le message
        popupGif.src = 'assets/images/racoon.gif';
        popupGif.alt = 'Racoon bravo';
        popupQuestion.textContent = 'Bravo, on en doutait tous !';
        popupButtons.style.display = 'none';
        setTimeout(closePopup, 2200);
    };

    // Gérer le clic sur "Tu m'as cramé..."
    failBtn.onclick = () => {
        failChallenge(challenge.id);
        // Afficher le dog et le message
        popupGif.src = 'assets/images/dog.gif';
        popupGif.alt = 'Dog fail';
        popupQuestion.textContent = 'Pas étonnant donc pas étonnées...';
        popupButtons.style.display = 'none';
        setTimeout(closePopup, 2200);
    };

    // Fermer la popup en cliquant à l'extérieur
    popup.onclick = (e) => {
        if (e.target === popup) {
            closePopup();
        }
    };
}

// Fonction pour fermer la popup
function closePopup() {
    const popup = document.getElementById('challenge-popup');
    popup.classList.remove('active');
}

// Fonction pour marquer un défi comme réussi
async function completeChallenge(challengeId) {
    localStorage.setItem(`challenge_${challengeId}_completed`, 'true');
    localStorage.removeItem(`challenge_${challengeId}_failed`); // Enlever le statut échoué si il existait
    
    // Mettre à jour l'affichage
    updateChallengeDisplay(challengeId, 'completed');
    
    // Synchroniser avec le serveur si connecté
    if (window.authService && window.authService.isUserAuthenticated()) {
        try {
            const challenges = {};
            const challengeKeys = Object.keys(localStorage).filter(key => key.startsWith('challenge_'));
            challengeKeys.forEach(key => {
                const id = key.replace('challenge_', '').replace('_completed', '').replace('_failed', '');
                if (!challenges[id]) {
                    challenges[id] = {};
                }
                if (key.includes('_completed')) {
                    challenges[id].completed = localStorage.getItem(key) === 'true';
                }
                if (key.includes('_failed')) {
                    challenges[id].failed = localStorage.getItem(key) === 'true';
                }
            });
            
            await window.authService.saveData('challenges', challenges);
        } catch (error) {
            console.error('Erreur lors de la synchronisation du défi:', error);
        }
    }
    
    console.log(`🎉 Challenge ${challengeId} completed!`);
}

// Fonction pour marquer un défi comme échoué
async function failChallenge(challengeId) {
    localStorage.setItem(`challenge_${challengeId}_failed`, 'true');
    localStorage.removeItem(`challenge_${challengeId}_completed`); // Enlever le statut réussi si il existait
    
    // Mettre à jour l'affichage
    updateChallengeDisplay(challengeId, 'failed');
    
    // Synchroniser avec le serveur si connecté
    if (window.authService && window.authService.isUserAuthenticated()) {
        try {
            const challenges = {};
            const challengeKeys = Object.keys(localStorage).filter(key => key.startsWith('challenge_'));
            challengeKeys.forEach(key => {
                const id = key.replace('challenge_', '').replace('_completed', '').replace('_failed', '');
                if (!challenges[id]) {
                    challenges[id] = {};
                }
                if (key.includes('_completed')) {
                    challenges[id].completed = localStorage.getItem(key) === 'true';
                }
                if (key.includes('_failed')) {
                    challenges[id].failed = localStorage.getItem(key) === 'true';
                }
            });
            
            await window.authService.saveData('challenges', challenges);
        } catch (error) {
            console.error('Erreur lors de la synchronisation du défi:', error);
        }
    }
    
    console.log(`😔 Challenge ${challengeId} failed!`);
}

// Fonction pour mettre à jour l'affichage d'un défi
function updateChallengeDisplay(challengeId, status) {
    const challengeElement = document.querySelector(`[data-challenge-id="${challengeId}"]`);
    if (challengeElement) {
        const statusElement = challengeElement.querySelector('.challenge-status');
        
        if (status === 'completed') {
            statusElement.textContent = '✅ Défi réussi !';
            statusElement.className = 'challenge-status completed';
        } else if (status === 'failed') {
            statusElement.textContent = '❌ Défi échoué';
            statusElement.className = 'challenge-status failed';
        }
    }
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
            
            // Réinitialiser tous les statuts des défis
            MONTHLY_CHALLENGES.forEach(challenge => {
                localStorage.removeItem(`challenge_${challenge.id}_completed`);
                localStorage.removeItem(`challenge_${challenge.id}_failed`);
            });
            
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