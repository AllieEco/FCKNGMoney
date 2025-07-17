// RPGhetto.js - Gestion des badges et défis mensuels

// Configuration des badges (à étendre plus tard)
const BADGES_CONFIG = {
    bonus: [
        // Badges bonus à venir
    ]
};

// Configuration des défis mensuels (maintenant gérée côté serveur)
// Cette liste est maintenant synchronisée avec server.js

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
async function loadMonthlyChallenges() {
    const challengesGrid = document.getElementById('challenges-grid');
    
    if (!challengesGrid) return;
    
    // Vérifier si l'utilisateur est connecté
    if (!window.authService || !window.authService.isUserAuthenticated()) {
        // Si non connecté, afficher un message
        challengesGrid.innerHTML = `
            <div class="challenge-card" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                <h3>🔐 Connexion requise</h3>
                <p>Connectez-vous pour voir vos défis mensuels</p>
            </div>
        `;
        return;
    }
    
    try {
        // Récupérer l'email de l'utilisateur connecté
        const currentUser = window.authService.getCurrentUser();
        if (!currentUser || !currentUser.email) {
            throw new Error('Email utilisateur non trouvé');
        }
        const userEmail = currentUser.email;
        
        // Appeler l'API pour récupérer les défis
        const response = await fetch(`/api/monthly-challenges/${encodeURIComponent(userEmail)}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Erreur lors du chargement des défis');
        }
        
        // Vider la grille
        challengesGrid.innerHTML = '';
        
        // Générer les défis pour le mois actuel
        data.challenges.forEach(challenge => {
            const challengeElement = createChallengeElement(challenge, data.status);
            challengesGrid.appendChild(challengeElement);
        });
        
        console.log('🎯 Monthly challenges loaded from server');
        
    } catch (error) {
        console.error('Erreur lors du chargement des défis:', error);
        challengesGrid.innerHTML = `
            <div class="challenge-card" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                <h3>❌ Erreur</h3>
                <p>Impossible de charger les défis: ${error.message}</p>
            </div>
        `;
    }
}

// Fonction pour créer un élément de défi
function createChallengeElement(challenge, statusData = {}) {
    const challengeDiv = document.createElement('div');
    challengeDiv.className = 'challenge-card';
    challengeDiv.dataset.challengeId = challenge.id;
    
    // Vérifier le statut du défi depuis les données du serveur
    const challengeStatus = statusData[challenge.id];
    const isCompleted = challengeStatus === 'completed';
    const isFailed = challengeStatus === 'failed';
    
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

// Fonction pour créer une explosion de confettis
function createConfettiExplosion() {
    // Trouver la popup pour calculer le point d'explosion
    const popup = document.getElementById('challenge-popup');
    if (!popup) return;
    
    const popupRect = popup.getBoundingClientRect();
    const explosionX = popupRect.left + popupRect.width / 2;
    const explosionY = popupRect.top + popupRect.height / 2;
    
    // Créer le conteneur de confettis
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);
    
    // Créer 60 confettis pour plus d'effet
    const confettiCount = 60;
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        // Calculer une direction aléatoire pour chaque confetti
        const angle = (Math.PI * 2 * i) / confettiCount + (Math.random() - 0.5) * 0.5;
        const distance = 100 + Math.random() * 150; // Distance variable
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance - 50; // Monter un peu avant de tomber
        
        // Positionner le confetti au point d'explosion
        confetti.style.left = explosionX + 'px';
        confetti.style.top = explosionY + 'px';
        
        // Définir les variables CSS pour l'animation
        confetti.style.setProperty('--explosion-x', x + 'px');
        confetti.style.setProperty('--explosion-y', y + 'px');
        
        // Délai aléatoire pour un effet plus naturel
        confetti.style.animationDelay = Math.random() * 0.3 + 's';
        
        confettiContainer.appendChild(confetti);
    }
    
    // Supprimer le conteneur après l'animation
    setTimeout(() => {
        if (confettiContainer.parentNode) {
            confettiContainer.parentNode.removeChild(confettiContainer);
        }
    }, 3500);
}

// Fonction pour marquer un défi comme réussi
async function completeChallenge(challengeId) {
    // Vérifier si l'utilisateur est connecté
    if (!window.authService || !window.authService.isUserAuthenticated()) {
        console.error('Utilisateur non connecté');
        return;
    }
    
    try {
        const currentUser = window.authService.getCurrentUser();
        if (!currentUser || !currentUser.email) {
            throw new Error('Email utilisateur non trouvé');
        }
        const userEmail = currentUser.email;
        
        // Appeler l'API pour mettre à jour le statut
        const response = await fetch('/api/update-challenge-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: userEmail,
                challengeId: challengeId,
                status: 'completed'
            })
        });
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Erreur lors de la mise à jour du statut');
        }
        
        // Mettre à jour l'affichage
        updateChallengeDisplay(challengeId, 'completed');
        
        // Créer l'explosion de confettis ! 🎉
        createConfettiExplosion();
        
        console.log(`🎉 Challenge ${challengeId} completed!`);
        
    } catch (error) {
        console.error('Erreur lors de la complétion du défi:', error);
        alert('Erreur lors de la sauvegarde du défi: ' + error.message);
    }
}

// Fonction pour marquer un défi comme échoué
async function failChallenge(challengeId) {
    // Vérifier si l'utilisateur est connecté
    if (!window.authService || !window.authService.isUserAuthenticated()) {
        console.error('Utilisateur non connecté');
        return;
    }
    
    try {
        const currentUser = window.authService.getCurrentUser();
        if (!currentUser || !currentUser.email) {
            throw new Error('Email utilisateur non trouvé');
        }
        const userEmail = currentUser.email;
        
        // Appeler l'API pour mettre à jour le statut
        const response = await fetch('/api/update-challenge-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: userEmail,
                challengeId: challengeId,
                status: 'failed'
            })
        });
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Erreur lors de la mise à jour du statut');
        }
        
        // Mettre à jour l'affichage
        updateChallengeDisplay(challengeId, 'failed');
        
        console.log(`😔 Challenge ${challengeId} failed!`);
        
    } catch (error) {
        console.error('Erreur lors de l\'échec du défi:', error);
        alert('Erreur lors de la sauvegarde du défi: ' + error.message);
    }
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

// La régénération des défis est maintenant gérée côté serveur
// Les défis sont automatiquement créés lors de la première visite du mois



// Export des fonctions pour utilisation dans d'autres fichiers
window.RPGhetto = {
    addBadge,
    updateBadgeStats,
    calculateTotalScore,
    loadMonthlyChallenges
}; 