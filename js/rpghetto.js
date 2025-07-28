// RPGhetto.js - Gestion des badges et défis mensuels

// Variables globales pour le carrousel
let currentCarouselIndex = 0;
let badgesPerView = 3; // Nombre de badges visibles à la fois

// Configuration du système de niveau
const LEVEL_CONFIG = {
    // XP requis pour chaque niveau (niveau 1 = 0 XP, niveau 2 = 100 XP, etc.)
    xpRequirements: [
        0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, // Niveaux 1-10
        3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450, // Niveaux 11-20
        11500, 12600, 13800, 15100, 16500, 18000, 19600, 21300, 23100, 25000 // Niveaux 21-30
    ],
    
    // Titres des niveaux
    levelTitles: [
        'Débutant', 'Apprenti', 'Initié', 'Adepte', 'Expert',
        'Maître', 'Grand Maître', 'Légende', 'Mythique', 'Divin',
        'Sage', 'Oracle', 'Prophète', 'Visionnaire', 'Illuminé',
        'Transcendant', 'Éternel', 'Immortel', 'Cosmique', 'Universel',
        'Omnipotent', 'Omniscient', 'Omniprésent', 'Créateur', 'Destructeur',
        'Équilibré', 'Harmonieux', 'Parfait', 'Absolu', 'Infini'
    ]
};

// Fonction pour calculer le niveau à partir des points XP
function calculateLevel(totalXP) {
    for (let i = LEVEL_CONFIG.xpRequirements.length - 1; i >= 0; i--) {
        if (totalXP >= LEVEL_CONFIG.xpRequirements[i]) {
            return i + 1;
        }
    }
    return 1;
}

// Fonction pour obtenir le titre du niveau
function getLevelTitle(level) {
    return LEVEL_CONFIG.levelTitles[level - 1] || 'Inconnu';
}

// Fonction pour calculer la progression dans le niveau actuel
function calculateLevelProgress(totalXP) {
    const currentLevel = calculateLevel(totalXP);
    const currentLevelXP = LEVEL_CONFIG.xpRequirements[currentLevel - 1];
    const nextLevelXP = LEVEL_CONFIG.xpRequirements[currentLevel] || currentLevelXP + 1000;
    
    const xpInCurrentLevel = totalXP - currentLevelXP;
    const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
    
    return {
        currentLevel,
        currentXP: totalXP,
        xpInCurrentLevel,
        xpNeededForNextLevel,
        nextLevelXP,
        progressPercentage: Math.min(100, (xpInCurrentLevel / xpNeededForNextLevel) * 100)
    };
}

// Fonction pour mettre à jour l'affichage du profil utilisateur
async function updateUserProfile() {
    const userNameElement = document.getElementById('user-name');
    const userLevelElement = document.getElementById('user-level');
    const levelTitleElement = document.getElementById('level-title');
    const currentXPElement = document.getElementById('current-xp');
    const nextLevelXPElement = document.getElementById('next-level-xp');
    const progressFillElement = document.getElementById('progress-fill');
    const progressPercentageElement = document.getElementById('progress-percentage');
    const totalScoreElement = document.getElementById('total-score');
    const totalBadgesElement = document.getElementById('total-badges');
    const completedChallengesElement = document.getElementById('completed-challenges');
    
    // Vérifier si l'utilisateur est connecté
    if (!window.authService || !window.authService.isUserAuthenticated()) {
        if (userNameElement) userNameElement.textContent = 'Non connecté';
        if (userLevelElement) userLevelElement.textContent = 'Niveau 1';
        if (levelTitleElement) levelTitleElement.textContent = 'Débutant';
        if (currentXPElement) currentXPElement.textContent = '0';
        if (nextLevelXPElement) nextLevelXPElement.textContent = '100';
        if (progressFillElement) progressFillElement.style.width = '0%';
        if (progressPercentageElement) progressPercentageElement.textContent = '0%';
        if (totalScoreElement) totalScoreElement.textContent = '0';
        if (totalBadgesElement) totalBadgesElement.textContent = '0';
        if (completedChallengesElement) completedChallengesElement.textContent = '0';
        return;
    }
    
    try {
        const user = window.authService.getCurrentUser();
        if (!user) return;
        
        // Afficher le nom de l'utilisateur
        if (userNameElement) {
            const displayName = user.displayName || user.email.split('@')[0];
            userNameElement.textContent = displayName;
        }
        
        // Calculer le score total (badges + défis)
        const storageKey = getExpensesStorageKey();
        const expenses = JSON.parse(localStorage.getItem(storageKey)) || [];
        
        // Calculer les points des badges
        const allBadges = [
            ...BADGES_CONFIG.resistance,
            ...BADGES_CONFIG.savings,
            ...BADGES_CONFIG.positive_balance
        ];
        
        let badgePoints = 0;
        let earnedBadges = 0;
        
        allBadges.forEach(badge => {
            if (badge.condition(expenses)) {
                badgePoints += badge.points;
                earnedBadges++;
            }
        });
        
        // Calculer les points des défis
        let challengePoints = 0;
        let completedChallenges = 0;
        
        try {
            const response = await fetch(`/api/monthly-challenges/${encodeURIComponent(user.email)}`);
            const data = await response.json();
            
            if (data.success && data.status) {
                Object.values(data.status).forEach(status => {
                    if (status === 'completed') {
                        challengePoints += 50; // 50 points par défi réussi
                        completedChallenges++;
                    }
                });
            }
        } catch (error) {
            console.error('Erreur lors du calcul des points des défis:', error);
        }
        
        // Score total
        const totalScore = badgePoints + challengePoints;
        
        // Calculer le niveau et la progression
        const levelInfo = calculateLevelProgress(totalScore);
        
        // Mettre à jour l'affichage
        if (userLevelElement) userLevelElement.textContent = `Niveau ${levelInfo.currentLevel}`;
        if (levelTitleElement) levelTitleElement.textContent = getLevelTitle(levelInfo.currentLevel);
        if (currentXPElement) currentXPElement.textContent = levelInfo.xpInCurrentLevel;
        if (nextLevelXPElement) nextLevelXPElement.textContent = levelInfo.xpNeededForNextLevel;
        if (progressFillElement) progressFillElement.style.width = `${levelInfo.progressPercentage}%`;
        if (progressPercentageElement) progressPercentageElement.textContent = `${Math.round(levelInfo.progressPercentage)}%`;
        if (totalScoreElement) totalScoreElement.textContent = totalScore;
        if (totalBadgesElement) totalBadgesElement.textContent = earnedBadges;
        if (completedChallengesElement) completedChallengesElement.textContent = completedChallenges;
        
        console.log(`👤 Profil utilisateur mis à jour: Niveau ${levelInfo.currentLevel} (${levelInfo.progressPercentage.toFixed(1)}%)`);
        
        // Détecter et célébrer les montées de niveau
        checkLevelUp(levelInfo.currentLevel);
        
        // Vérifier le statut d'avatar après la mise à jour du profil
        await checkAvatarUnlockStatus();
        
    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
    }
}

// Variable pour stocker le niveau précédent
let previousLevel = 1;

// Fonction pour charger le niveau précédent depuis le serveur ou localStorage
async function loadPreviousLevel() {
    if (window.authService && window.authService.isUserAuthenticated()) {
        try {
            // Essayer de récupérer depuis le serveur
            const serverLevel = await window.authService.getData('previousLevel');
            if (serverLevel !== null) {
                return parseInt(serverLevel);
            }
        } catch (error) {
            console.warn('Impossible de récupérer le niveau depuis le serveur, utilisation du localStorage:', error);
        }
        
        // Fallback vers localStorage
        const user = window.authService.getCurrentUser();
        const storedLevel = localStorage.getItem(`previousLevel_${user.email}`);
        return storedLevel ? parseInt(storedLevel) : 1;
    }
    return parseInt(localStorage.getItem('previousLevel_local')) || 1;
}

// Fonction pour sauvegarder le niveau précédent dans le serveur et localStorage
async function savePreviousLevel(level) {
    if (window.authService && window.authService.isUserAuthenticated()) {
        try {
            // Sauvegarder sur le serveur
            await window.authService.saveData('previousLevel', level);
            console.log('✅ Niveau précédent synchronisé avec le serveur');
        } catch (error) {
            console.error('Erreur lors de la synchronisation du niveau avec le serveur:', error);
        }
        
        // Sauvegarder aussi en local comme backup
        const user = window.authService.getCurrentUser();
        localStorage.setItem(`previousLevel_${user.email}`, level.toString());
    } else {
        localStorage.setItem('previousLevel_local', level.toString());
    }
}

// Fonction pour détecter et célébrer les montées de niveau
async function checkLevelUp(currentLevel) {
    // Charger le niveau précédent depuis le serveur/localStorage
    previousLevel = await loadPreviousLevel();
    
    if (currentLevel > previousLevel) {
        const levelTitle = getLevelTitle(currentLevel);
        
        // Créer une notification de montée de niveau
        showLevelUpNotification(currentLevel, levelTitle);
        
        // Créer une explosion de confettis spéciale
        createLevelUpConfetti();
        
        console.log(`🎉 Niveau ${currentLevel} atteint ! Titre: ${levelTitle}`);
        
        // Mettre à jour le niveau précédent et le sauvegarder
        previousLevel = currentLevel;
        await savePreviousLevel(currentLevel);
        
        // Sauvegarder la date d'atteinte du niveau
        await saveLevelAchievement(currentLevel, levelTitle);
    }
}

// Fonction pour sauvegarder la date d'atteinte d'un niveau
async function saveLevelAchievement(level, title) {
    if (!window.authService || !window.authService.isUserAuthenticated()) {
        return;
    }
    
    try {
        const achievementData = {
            level: level,
            title: title,
            date: new Date().toISOString(),
            type: 'level'
        };
        
        // Récupérer les accomplissements existants
        const existingAchievements = await window.authService.getData('achievements') || [];
        
        // Vérifier si ce niveau n'a pas déjà été enregistré
        const levelExists = existingAchievements.some(achievement => 
            achievement.type === 'level' && achievement.level === level
        );
        
        if (!levelExists) {
            existingAchievements.push(achievementData);
            await window.authService.saveData('achievements', existingAchievements);
            console.log(`📅 Date d'atteinte du niveau ${level} sauvegardée`);
        }
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la date de niveau:', error);
    }
}

// Fonction pour détecter et sauvegarder les nouveaux badges acquis
async function detectAndSaveNewBadges(currentEarnedBadges) {
    if (!window.authService || !window.authService.isUserAuthenticated()) {
        return;
    }
    
    try {
        // Récupérer les badges déjà enregistrés
        const existingAchievements = await window.authService.getData('achievements') || [];
        const existingBadgeIds = existingAchievements
            .filter(achievement => achievement.type === 'badge')
            .map(achievement => achievement.badgeId);
        
        // Identifier les nouveaux badges
        const newBadges = currentEarnedBadges.filter(badge => 
            !existingBadgeIds.includes(badge.id)
        );
        
        // Sauvegarder les nouveaux badges
        if (newBadges.length > 0) {
            const newAchievements = newBadges.map(badge => ({
                badgeId: badge.id,
                title: badge.title,
                description: badge.description,
                points: badge.points,
                date: new Date().toISOString(),
                type: 'badge'
            }));
            
            existingAchievements.push(...newAchievements);
            await window.authService.saveData('achievements', existingAchievements);
            
            console.log(`📅 ${newBadges.length} nouveau(x) badge(s) sauvegardé(s):`, 
                newBadges.map(b => b.title).join(', '));
        }
    } catch (error) {
        console.error('Erreur lors de la détection des nouveaux badges:', error);
    }
}

// Fonction pour sauvegarder la date de complétion d'un défi (seulement les réussites)
async function saveChallengeAchievement(challengeId, status) {
    if (!window.authService || !window.authService.isUserAuthenticated()) {
        return;
    }
    
    // Ne sauvegarder que les défis réussis dans l'historique des accomplissements
    if (status !== 'completed') {
        console.log(`📝 Défi ${challengeId} échoué - pas sauvegardé dans l'historique`);
        return;
    }
    
    try {
        const achievementData = {
            challengeId: challengeId,
            status: status,
            date: new Date().toISOString(),
            type: 'challenge'
        };
        
        // Récupérer les accomplissements existants
        const existingAchievements = await window.authService.getData('achievements') || [];
        
        // Vérifier si ce défi n'a pas déjà été enregistré
        const challengeExists = existingAchievements.some(achievement => 
            achievement.type === 'challenge' && 
            achievement.challengeId === challengeId && 
            achievement.status === 'completed'
        );
        
        if (!challengeExists) {
            existingAchievements.push(achievementData);
            await window.authService.saveData('achievements', existingAchievements);
            console.log(`📅 Date de réussite du défi ${challengeId} sauvegardée`);
        }
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la date de défi:', error);
    }
}

// Fonction pour charger et afficher l'historique des accomplissements
async function loadAchievementsHistory() {
    if (!window.authService || !window.authService.isUserAuthenticated()) {
        return;
    }
    
    try {
        const achievements = await window.authService.getData('achievements') || [];
        
        // Récupérer les défis actuels depuis l'API
        let challengesData = {};
        try {
            const currentUser = window.authService.getCurrentUser();
            const userEmail = currentUser.email;
            const response = await fetch(`/api/monthly-challenges/${encodeURIComponent(userEmail)}`);
            const data = await response.json();
            if (data.success && data.status) {
                challengesData = data.status;
            }
        } catch (error) {
            console.warn('Impossible de récupérer les défis pour le résumé:', error);
        }
        
        // Compter les défis réussis et échoués depuis l'API
        let challengesCompleted = 0;
        let challengesFailed = 0;
        
        Object.values(challengesData).forEach(status => {
            if (status === 'completed') {
                challengesCompleted++;
            } else if (status === 'failed') {
                challengesFailed++;
            }
        });
        
        // Ajouter les défis historiques sauvegardés dans la BDD
        const historicalCompleted = achievements.filter(a => a.type === 'challenge' && a.status === 'completed').length;
        const historicalFailed = achievements.filter(a => a.type === 'challenge' && a.status === 'failed').length;
        
        // Total = défis actuels + défis historiques
        const totalCompleted = challengesCompleted + historicalCompleted;
        const totalFailed = challengesFailed + historicalFailed;
        
        if (achievements.length === 0 && challengesCompleted === 0 && challengesFailed === 0) {
            console.log('📅 Aucun accomplissement enregistré');
            return;
        }
        
        // Trier par date (plus récent en premier)
        achievements.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        console.log('📅 Historique des accomplissements:', achievements);
        console.log('🎯 Défis actuels:', challengesData);
        
        // Créer un résumé des accomplissements
        const summary = {
            levels: achievements.filter(a => a.type === 'level').length,
            badges: achievements.filter(a => a.type === 'badge').length,
            challengesCompleted: totalCompleted,
            challengesFailed: totalFailed,
            total: achievements.length + totalCompleted + totalFailed
        };
        
        console.log('📊 Résumé des accomplissements:', summary);
        
        // Optionnel : Afficher dans une section dédiée de la page
        displayAchievementsSummary(summary);
        
    } catch (error) {
        console.error('Erreur lors du chargement de l\'historique des accomplissements:', error);
    }
}

// Fonction pour afficher un résumé des accomplissements
function displayAchievementsSummary(summary) {
    // Chercher une section existante ou en créer une nouvelle
    let summarySection = document.getElementById('achievements-summary');
    
    if (!summarySection) {
        // Créer une nouvelle section si elle n'existe pas
        const main = document.querySelector('main');
        if (main) {
            summarySection = document.createElement('section');
            summarySection.id = 'achievements-summary';
            summarySection.innerHTML = `
                <h2>📅 Historique des Accomplissements</h2>
                <div class="achievements-summary-grid">
                    <div class="achievement-stat">
                        <span class="achievement-icon">⭐</span>
                        <span class="achievement-count">${summary.levels}</span>
                        <span class="achievement-label">Niveaux atteints</span>
                    </div>
                    <div class="achievement-stat">
                        <span class="achievement-icon">🏆</span>
                        <span class="achievement-count">${summary.badges}</span>
                        <span class="achievement-label">Badges acquis</span>
                    </div>
                    <div class="achievement-stat">
                        <span class="achievement-icon">✅</span>
                        <span class="achievement-count">${summary.challengesCompleted}</span>
                        <span class="achievement-label">Défis réussis</span>
                    </div>
                    <div class="achievement-stat">
                        <span class="achievement-icon">❌</span>
                        <span class="achievement-count">${summary.challengesFailed}</span>
                        <span class="achievement-label">Défis échoués</span>
                    </div>
                </div>
            `;
            
            // Insérer après la section des défis mensuels
            const challengesSection = document.getElementById('monthly-challenges-section');
            if (challengesSection && challengesSection.nextSibling) {
                main.insertBefore(summarySection, challengesSection.nextSibling);
            } else {
                main.appendChild(summarySection);
            }
        }
    } else {
        // Mettre à jour la section existante
        const counts = summarySection.querySelectorAll('.achievement-count');
        if (counts.length >= 4) {
            counts[0].textContent = summary.levels;
            counts[1].textContent = summary.badges;
            counts[2].textContent = summary.challengesCompleted;
            counts[3].textContent = summary.challengesFailed;
        }
    }
}

// Fonction pour afficher une notification de montée de niveau
function showLevelUpNotification(level, title) {
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = 'level-up-notification';
    notification.innerHTML = `
        <div class="level-up-content">
            <div class="level-up-icon">⭐</div>
            <div class="level-up-text">
                <h3>Niveau ${level} atteint !</h3>
                <p>Tu es maintenant ${title} !</p>
            </div>
        </div>
    `;
    
    // Ajouter au body
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Supprimer après 5 secondes
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 5000);
}

// Fonction pour créer une explosion de confettis spéciale pour les montées de niveau
function createLevelUpConfetti() {
    // Trouver le centre de l'écran
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Créer le conteneur de confettis
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container level-up-confetti';
    document.body.appendChild(confettiContainer);
    
    // Créer plus de confettis pour une célébration plus importante
    const confettiCount = 100;
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti level-up-confetti-piece';
        
        // Couleurs spéciales pour les montées de niveau (doré, argenté, etc.)
        const colors = ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
        confetti.style.background = colors[i % colors.length];
        
        // Calculer une direction aléatoire
        const angle = (Math.PI * 2 * i) / confettiCount + (Math.random() - 0.5) * 0.5;
        const distance = 150 + Math.random() * 200;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance - 100;
        
        // Positionner le confetti
        confetti.style.left = centerX + 'px';
        confetti.style.top = centerY + 'px';
        
        // Définir les variables CSS pour l'animation
        confetti.style.setProperty('--explosion-x', x + 'px');
        confetti.style.setProperty('--explosion-y', y + 'px');
        
        // Délai aléatoire
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        
        confettiContainer.appendChild(confetti);
    }
    
    // Supprimer le conteneur après l'animation
    setTimeout(() => {
        if (confettiContainer.parentNode) {
            confettiContainer.parentNode.removeChild(confettiContainer);
        }
    }, 4000);
}

// Fonction pour obtenir la clé de stockage spécifique à l'utilisateur
function getExpensesStorageKey() {
    if (window.authService && window.authService.isUserAuthenticated()) {
        const user = window.authService.getCurrentUser();
        return `expenses_${user.email}`;
    }
    return 'expenses_local'; // Pour les utilisateurs non connectés
}

// Configuration des badges basée sur les images disponibles
const BADGES_CONFIG = {
    resistance: [
        {
            id: '7days_no_crack',
            title: '7 Jours Sans Craquage',
            description: 'Tu as tenu 7 jours consécutifs sans dépense inutile !',
            icon: 'assets/images/7-jours-sans-craquages.png',
            points: 25,
            condition: (expenses) => {
                return hasEverReachedConsecutiveDays(expenses, 7);
            }
        },
        {
            id: '14days_no_crack',
            title: '14 Jours Sans Craquage',
            description: 'Deux semaines consécutives de discipline !',
            icon: 'assets/images/14_jours_sans_craquages.png',
            points: 50,
            condition: (expenses) => {
                return hasEverReachedConsecutiveDays(expenses, 14);
            }
        },
        {
            id: '20days_no_crack',
            title: '20 Jours Sans Craquage',
            description: 'Près de 3 semaines consécutives de maîtrise !',
            icon: 'assets/images/20-jours-sans-craquages.png',
            points: 75,
            condition: (expenses) => {
                return hasEverReachedConsecutiveDays(expenses, 20);
            }
        }
    ],
    savings: [
        {
            id: '100_economies_mois',
            title: '100€ d\'Épargne',
            description: 'Tu as épargné 100€ ce mois-ci !',
            icon: 'assets/images/100-economies-mois.png',
            points: 30,
            condition: (expenses) => {
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                
                // Compter les dépenses d'épargne du mois actuel
                const monthlySavings = expenses.filter(exp => {
                    const expDate = new Date(exp.date);
                    return expDate.getMonth() === currentMonth && 
                           expDate.getFullYear() === currentYear &&
                           exp.category === 'Epargne (Retarder l\'inévitable)';
                });
                
                const totalSavings = monthlySavings.reduce((sum, exp) => sum + Math.abs(exp.amount), 0);
                return totalSavings >= 100;
            }
        },
        {
            id: '200_economies_mois',
            title: '200€ d\'Épargne',
            description: 'Tu as épargné 200€ ce mois-ci !',
            icon: 'assets/images/200-economies-mois.png',
            points: 60,
            condition: (expenses) => {
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                
                // Compter les dépenses d'épargne du mois actuel
                const monthlySavings = expenses.filter(exp => {
                    const expDate = new Date(exp.date);
                    return expDate.getMonth() === currentMonth && 
                           expDate.getFullYear() === currentYear &&
                           exp.category === 'Epargne (Retarder l\'inévitable)';
                });
                
                const totalSavings = monthlySavings.reduce((sum, exp) => sum + Math.abs(exp.amount), 0);
                return totalSavings >= 200;
            }
        },
        {
            id: '300_economies_mois',
            title: '300€ d\'Épargne',
            description: 'Tu as épargné 300€ ce mois-ci !',
            icon: 'assets/images/300-economie-mois.png',
            points: 100,
            condition: (expenses) => {
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                
                // Compter les dépenses d'épargne du mois actuel
                const monthlySavings = expenses.filter(exp => {
                    const expDate = new Date(exp.date);
                    return expDate.getMonth() === currentMonth && 
                           expDate.getFullYear() === currentYear &&
                           exp.category === 'Epargne (Retarder l\'inévitable)';
                });
                
                const totalSavings = monthlySavings.reduce((sum, exp) => sum + Math.abs(exp.amount), 0);
                return totalSavings >= 300;
            }
        }
    ],
    positive_balance: [
        {
            id: 'solde_positif_mois1',
            title: 'Solde Positif - 1 Mois',
            description: 'Un mois complet avec un solde positif !',
            icon: 'assets/images/solde-positif-mois1.png',
            points: 40,
            condition: (expenses) => {
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                const monthlyBalance = expenses.filter(exp => {
                    const expDate = new Date(exp.date);
                    return expDate.getMonth() === currentMonth && 
                           expDate.getFullYear() === currentYear;
                }).reduce((balance, exp) => balance + exp.amount, 0);
                return monthlyBalance > 0;
            }
        },
        {
            id: 'solde_positif_mois2',
            title: 'Solde Positif - 2 Mois',
            description: 'Deux mois d\'affilée avec un solde positif !',
            icon: 'assets/images/solde-positif-mois2.png',
            points: 80,
            condition: (expenses) => {
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                
                const currentMonthBalance = expenses.filter(exp => {
                    const expDate = new Date(exp.date);
                    return expDate.getMonth() === currentMonth && 
                           expDate.getFullYear() === currentYear;
                }).reduce((balance, exp) => balance + exp.amount, 0);
                
                const previousMonthBalance = expenses.filter(exp => {
                    const expDate = new Date(exp.date);
                    return expDate.getMonth() === previousMonth && 
                           expDate.getFullYear() === previousYear;
                }).reduce((balance, exp) => balance + exp.amount, 0);
                
                return currentMonthBalance > 0 && previousMonthBalance > 0;
            }
        },
        {
            id: 'solde_positif_mois3',
            title: 'Solde Positif - 3 Mois',
            description: 'Trois mois d\'affilée avec un solde positif !',
            icon: 'assets/images/solde-positif-mois3.png',
            points: 150,
            condition: (expenses) => {
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                
                // Vérifier les 3 derniers mois
                for (let i = 0; i < 3; i++) {
                    const month = (currentMonth - i + 12) % 12;
                    const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
                    
                    const monthBalance = expenses.filter(exp => {
                        const expDate = new Date(exp.date);
                        return expDate.getMonth() === month && 
                               expDate.getFullYear() === year;
                    }).reduce((balance, exp) => balance + exp.amount, 0);
                    
                    if (monthBalance <= 0) return false;
                }
                return true;
            }
        }
    ]
};

// Configuration des défis mensuels (maintenant gérée côté serveur)
// Cette liste est maintenant synchronisée avec server.js

// Configuration des avatars disponibles
const AVATARS_CONFIG = [
    {
        id: 'default',
        name: 'Défaut',
        image: '👤',
        type: 'emoji'
    },
    {
        id: 'cat',
        name: 'Chat Mignon',
        image: 'assets/images/cutecat.gif',
        type: 'gif',
        unlockLevel: 3
    },
    {
        id: 'dog',
        name: 'Chien Loyal',
        image: 'assets/images/dog.gif',
        type: 'gif',
        unlockLevel: 3
    },
    {
        id: 'racoon',
        name: 'Raton Laveur',
        image: 'assets/images/racoon.gif',
        type: 'gif',
        unlockLevel: 3
    },
    {
        id: 'ptdrtki',
        name: 'Mystérieux',
        image: 'assets/images/ptdrtki.gif',
        type: 'gif',
        unlockLevel: 5
    },
    {
        id: 'friday-happy',
        name: 'Friday Happy',
        image: 'assets/images/friday-happy.gif',
        type: 'gif',
        unlockLevel: 5
    }
];

// Initialisation de la page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🎮 RPGhetto page loaded');
    
    // Initialiser le niveau précédent depuis le serveur/localStorage
    previousLevel = await loadPreviousLevel();
    
    // Initialiser le profil utilisateur
    await updateUserProfile();
    
    // Initialiser les statistiques
    await updateBadgeStats();
    
    // Charger les badges (pour l'instant, juste les placeholders)
    loadBadges();
    
    // Charger les défis mensuels
    loadMonthlyChallenges();

    // Initialiser la popup des badges
    initializeBadgesPopup();
    
    // Initialiser la fonctionnalité d'avatar
    initializeAvatarSystem();
    
    // Charger l'historique des accomplissements
    await loadAchievementsHistory();
});

// Fonction pour charger les badges
async function loadBadges() {
    const bonusGrid = document.getElementById('bonus-badges-grid');
    
    if (!bonusGrid) return;
    
    // Vérifier si l'utilisateur est connecté
    if (!window.authService || !window.authService.isUserAuthenticated()) {
        bonusGrid.innerHTML = `
            <div class="badge-placeholder" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                <h3>🔐 Connexion requise</h3>
                <p>Connectez-vous pour voir vos badges</p>
            </div>
        `;
        return;
    }
    
    try {
        // Récupérer les dépenses de l'utilisateur
        const storageKey = getExpensesStorageKey();
        const expenses = JSON.parse(localStorage.getItem(storageKey)) || [];
        
        // Vider la grille
        bonusGrid.innerHTML = '';
        
        // Vérifier tous les badges
        const allBadges = [
            ...BADGES_CONFIG.resistance,
            ...BADGES_CONFIG.savings,
            ...BADGES_CONFIG.positive_balance
        ];
        
        // Séparer les badges débloqués et verrouillés
        const earnedBadges = [];
        const lockedBadges = [];
        
        allBadges.forEach(badge => {
            const isEarned = badge.condition(expenses);
            if (isEarned) {
                earnedBadges.push(badge);
            } else {
                lockedBadges.push(badge);
            }
        });
        
        // Détecter et sauvegarder les nouveaux badges acquis
        await detectAndSaveNewBadges(earnedBadges);
        
        // Afficher d'abord les badges débloqués, puis les verrouillés
        [...earnedBadges, ...lockedBadges].forEach(badge => {
            const isEarned = badge.condition(expenses);
            const badgeElement = createBadgeElement(badge, isEarned);
            bonusGrid.appendChild(badgeElement);
        });
        
        console.log(`📛 ${earnedBadges.length} badges débloqués affichés en premier`);
        
        // Initialiser le carrousel après avoir chargé les badges
        initializeCarousel();
        
    } catch (error) {
        console.error('Erreur lors du chargement des badges:', error);
        bonusGrid.innerHTML = `
            <div class="badge-placeholder" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                <h3>❌ Erreur</h3>
                <p>Impossible de charger les badges: ${error.message}</p>
            </div>
        `;
    }
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
        
        // Sauvegarder la date de complétion du défi
        await saveChallengeAchievement(challengeId, 'completed');
        
        // Mettre à jour les statistiques des badges
        await updateBadgeStats();
        
        // Mettre à jour le profil utilisateur
        await updateUserProfile();
        
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
        
        // Sauvegarder la date d'échec du défi
        await saveChallengeAchievement(challengeId, 'failed');
        
        // Mettre à jour les statistiques des badges
        await updateBadgeStats();
        
        // Mettre à jour le profil utilisateur
        await updateUserProfile();
        
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
async function updateBadgeStats() {
    // Remplacer par l'affichage de l'historique des accomplissements
    await displayAchievementsHistory();
}

// Fonction pour afficher l'historique complet des accomplissements
async function displayAchievementsHistory() {
    const badgeStatsSection = document.getElementById('badge-stats-section');
    
    if (!badgeStatsSection) {
        console.warn('Section badge-stats-section non trouvée');
        return;
    }
    
    // Vérifier si l'utilisateur est connecté
    if (!window.authService || !window.authService.isUserAuthenticated()) {
        badgeStatsSection.innerHTML = `
            <h2>📅 Historique des Accomplissements</h2>
            <p class="section-subtitle">Connectez-vous pour voir votre historique complet</p>
            <div class="achievements-placeholder">
                <p>🔐 Connexion requise pour voir vos exploits</p>
            </div>
        `;
        return;
    }
    
    try {
        // Récupérer tous les accomplissements depuis la BDD
        const achievements = await window.authService.getData('achievements') || [];
        
        // Récupérer les dépenses pour calculer les badges actuels
        const storageKey = getExpensesStorageKey();
        const expenses = JSON.parse(localStorage.getItem(storageKey)) || [];
        
        // Récupérer les défis depuis l'API
        const currentUser = window.authService.getCurrentUser();
        const userEmail = currentUser.email;
        
        let challengesData = {};
        try {
            const response = await fetch(`/api/monthly-challenges/${encodeURIComponent(userEmail)}`);
            const data = await response.json();
            if (data.success && data.status) {
                challengesData = data.status;
            }
        } catch (error) {
            console.warn('Impossible de récupérer les défis:', error);
        }
        
        // Créer la liste complète des accomplissements
        const allAchievements = await buildCompleteAchievementsList(achievements, expenses, challengesData);
        
        // Détecter et ajouter les niveaux manquants
        await detectAndAddMissingLevels(allAchievements, achievements);
        
        // Trier par date (plus récent en premier)
        allAchievements.sort((a, b) => {
            if (a.date === 'Date inconnue' && b.date === 'Date inconnue') return 0;
            if (a.date === 'Date inconnue') return 1;
            if (b.date === 'Date inconnue') return -1;
            return new Date(b.date) - new Date(a.date);
        });
        
        // Afficher l'historique
        displayAchievementsList(badgeStatsSection, allAchievements);
        
    } catch (error) {
        console.error('Erreur lors de l\'affichage de l\'historique:', error);
        badgeStatsSection.innerHTML = `
            <h2>📅 Historique des Accomplissements</h2>
            <p class="section-subtitle">Erreur lors du chargement de l'historique</p>
            <div class="achievements-placeholder">
                <p>❌ Impossible de charger l'historique: ${error.message}</p>
            </div>
        `;
    }
}

// Fonction pour construire la liste complète des accomplissements
async function buildCompleteAchievementsList(achievements, expenses, challengesData) {
    const allAchievements = [];
    
    // 1. Ajouter les accomplissements avec dates (depuis la BDD)
    achievements.forEach(achievement => {
        if (achievement.type === 'level') {
            allAchievements.push({
                type: 'level',
                title: `Niveau ${achievement.level} - ${achievement.title}`,
                description: `Tu as atteint le niveau ${achievement.level} !`,
                date: achievement.date,
                icon: '⭐',
                points: null // Pas de points pour les niveaux
            });
        } else if (achievement.type === 'badge') {
            allAchievements.push({
                type: 'badge',
                title: achievement.title,
                description: achievement.description,
                date: achievement.date,
                icon: '🏆',
                points: achievement.points
            });
        } else if (achievement.type === 'challenge' && achievement.status === 'completed') {
            allAchievements.push({
                type: 'challenge',
                title: `Défi ${achievement.challengeId} réussi`,
                description: `Tu as réussi ce défi !`,
                date: achievement.date,
                icon: '✅',
                points: 50
            });
        }
    });
    
    // 2. Ajouter les badges actuels sans dates (pour les exploits anciens)
    const allBadges = [
        ...BADGES_CONFIG.resistance,
        ...BADGES_CONFIG.savings,
        ...BADGES_CONFIG.positive_balance
    ];
    
    allBadges.forEach(badge => {
        if (badge.condition(expenses)) {
            // Vérifier si ce badge n'est pas déjà dans les accomplissements
            const alreadyExists = allAchievements.some(achievement => 
                achievement.type === 'badge' && achievement.title === badge.title
            );
            
            if (!alreadyExists) {
                allAchievements.push({
                    type: 'badge',
                    title: badge.title,
                    description: badge.description,
                    date: 'Date inconnue',
                    icon: '🏆',
                    points: badge.points,
                    unknownDate: true
                });
            }
        }
    });
    
    // 3. Ajouter les défis réussis sans dates
    if (challengesData) {
        Object.entries(challengesData).forEach(([challengeId, status]) => {
            if (status === 'completed') {
                // Vérifier si ce défi n'est pas déjà dans les accomplissements
                const alreadyExists = allAchievements.some(achievement => 
                    achievement.type === 'challenge' && 
                    achievement.title.includes(challengeId) &&
                    achievement.title.includes('réussi')
                );
                
                if (!alreadyExists) {
                    allAchievements.push({
                        type: 'challenge',
                        title: `Défi ${challengeId} réussi`,
                        description: `Tu as réussi ce défi !`,
                        date: 'Date inconnue',
                        icon: '✅',
                        points: 50,
                        unknownDate: true
                    });
                }
            }
        });
    }
    
    return allAchievements;
}

// Fonction pour détecter et ajouter les niveaux manquants
async function detectAndAddMissingLevels(allAchievements, existingAchievements) {
    if (!window.authService || !window.authService.isUserAuthenticated()) {
        return;
    }
    
    try {
        // Calculer le niveau actuel basé sur le score total
        const totalScore = await calculateTotalScore();
        const currentLevel = calculateLevel(totalScore);
        
        console.log('🔍 Debug niveaux:', {
            totalScore: totalScore,
            currentLevel: currentLevel,
            existingAchievements: existingAchievements.length
        });
        
        // Récupérer les niveaux déjà enregistrés
        const recordedLevels = existingAchievements
            .filter(achievement => achievement.type === 'level')
            .map(achievement => achievement.level);
        
        console.log('📊 Niveaux enregistrés:', recordedLevels);
        
        // Identifier les niveaux manquants
        const missingLevels = [];
        for (let level = 1; level <= currentLevel; level++) {
            if (!recordedLevels.includes(level)) {
                missingLevels.push(level);
            }
        }
        
        console.log('❌ Niveaux manquants:', missingLevels);
        
        // Ajouter les niveaux manquants à l'affichage
        missingLevels.forEach(level => {
            const levelTitle = getLevelTitle(level);
            allAchievements.push({
                type: 'level',
                title: `Niveau ${level} - ${levelTitle}`,
                description: `Tu as atteint le niveau ${level} !`,
                date: 'Date inconnue',
                icon: '⭐',
                points: null, // Pas de points pour les niveaux
                unknownDate: true
            });
        });
        
        // Sauvegarder les niveaux manquants dans la BDD
        if (missingLevels.length > 0) {
            const newLevelAchievements = missingLevels.map(level => ({
                level: level,
                title: getLevelTitle(level),
                date: new Date().toISOString(), // Date de découverte
                type: 'level'
            }));
            
            existingAchievements.push(...newLevelAchievements);
            await window.authService.saveData('achievements', existingAchievements);
            
            console.log(`📅 ${missingLevels.length} niveau(x) manquant(s) ajouté(s):`, 
                missingLevels.map(l => `Niveau ${l}`).join(', '));
        }
        
    } catch (error) {
        console.error('Erreur lors de la détection des niveaux manquants:', error);
    }
}

// Fonction pour afficher la liste des accomplissements
function displayAchievementsList(container, achievements) {
    if (achievements.length === 0) {
        container.innerHTML = `
            <p class="section-subtitle">Aucun accomplissement pour le moment</p>
            <div class="achievements-placeholder">
                <p>🎯 Commencez à accomplir des exploits pour les voir ici !</p>
            </div>
        `;
        return;
    }
    
    const achievementsHTML = achievements.map(achievement => {
        const dateDisplay = achievement.unknownDate 
            ? `<span class="unknown-date">Date inconnue (probablement pendant que tu dormais 😴)</span>`
            : `<span class="achievement-date">${new Date(achievement.date).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</span>`;
        
        return `
            <div class="achievement-item ${achievement.type}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-content">
                    <h3 class="achievement-title">${achievement.title}</h3>
                    <p class="achievement-description">${achievement.description}</p>
                    <div class="achievement-meta">
                        ${dateDisplay}
                        ${achievement.points !== null ? `<span class="achievement-points">+${achievement.points} points</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `
        <p class="section-subtitle">Tes exploits financiers dans le temps (${achievements.length} accomplissement${achievements.length > 1 ? 's' : ''})</p>
        <div class="achievements-list">
            ${achievementsHTML}
        </div>
    `;
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
function createBadgeElement(badgeData, isEarned = false) {
    const badgeDiv = document.createElement('div');
    badgeDiv.className = `badge-placeholder ${isEarned ? 'earned' : 'locked'}`;
    badgeDiv.dataset.badgeId = badgeData.id;
    badgeDiv.dataset.earned = isEarned;
    
    badgeDiv.innerHTML = `
        <div class="badge-icon">
            <img src="${badgeData.icon}" alt="${badgeData.title}" style="width: 120px; height: 120px; object-fit: contain;">
        </div>
        <h3>${badgeData.title}</h3>
        <p>${badgeData.description}</p>
        <div class="badge-points ${isEarned ? 'earned' : 'locked'}">+${badgeData.points} points</div>
        ${!isEarned ? '<div class="badge-locked-overlay">🔒</div>' : ''}
    `;
    
    return badgeDiv;
}

// Fonction pour calculer les jours consécutifs sans craquage
function calculateConsecutiveDaysWithoutCrack(expenses) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Remettre à minuit
    
    // Filtrer les dépenses "craquage" (non essentielles)
    const crackExpenses = expenses.filter(exp => 
        exp.type === 'expense' && 
        exp.necessity === 'Pose pas de questions qui fâchent'
    );
    
    // Si aucune dépense de craquage, retourner le nombre de jours depuis la première dépense
    if (crackExpenses.length === 0) {
        if (expenses.length === 0) {
            return 0; // Aucune dépense du tout
        }
        // Retourner les jours depuis la première dépense
        const firstExpense = new Date(expenses[0].date);
        firstExpense.setHours(0, 0, 0, 0);
        const daysSinceFirst = Math.floor((today - firstExpense) / (1000 * 60 * 60 * 24));
        return Math.max(0, daysSinceFirst);
    }
    
    // Trier les dépenses de craquage par date (plus récentes en premier)
    crackExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Prendre la date de la dernière dépense de craquage
    const lastCrackDate = new Date(crackExpenses[0].date);
    lastCrackDate.setHours(0, 0, 0, 0);
    
    // Calculer les jours depuis la dernière dépense de craquage
    const daysSinceLastCrack = Math.floor((today - lastCrackDate) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, daysSinceLastCrack);
}

// Fonction pour vérifier si l'utilisateur a déjà atteint un nombre de jours consécutifs
function hasEverReachedConsecutiveDays(expenses, targetDays) {
    // Filtrer les dépenses "craquage" (non essentielles)
    const crackExpenses = expenses.filter(exp => 
        exp.type === 'expense' && 
        exp.necessity === 'Pose pas de questions qui fâchent'
    );
    
    // Si aucune dépense de craquage, vérifier depuis la première dépense
    if (crackExpenses.length === 0) {
        if (expenses.length === 0) {
            return false;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstExpense = new Date(expenses[0].date);
        firstExpense.setHours(0, 0, 0, 0);
        const daysSinceFirst = Math.floor((today - firstExpense) / (1000 * 60 * 60 * 24));
        return daysSinceFirst >= targetDays;
    }
    
    // Trier les dépenses de craquage par date (plus anciennes en premier)
    crackExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Vérifier chaque période entre les craquages
    for (let i = 0; i < crackExpenses.length; i++) {
        const currentCrackDate = new Date(crackExpenses[i].date);
        currentCrackDate.setHours(0, 0, 0, 0);
        
        let previousCrackDate;
        if (i === 0) {
            // Première dépense de craquage - vérifier depuis le début
            if (expenses.length === 0) {
                continue;
            }
            const firstExpense = new Date(expenses[0].date);
            firstExpense.setHours(0, 0, 0, 0);
            previousCrackDate = firstExpense;
        } else {
            // Dépense de craquage précédente
            previousCrackDate = new Date(crackExpenses[i - 1].date);
            previousCrackDate.setHours(0, 0, 0, 0);
        }
        
        // Calculer les jours entre les deux craquages
        const daysBetweenCracks = Math.floor((currentCrackDate - previousCrackDate) / (1000 * 60 * 60 * 24));
        
        if (daysBetweenCracks >= targetDays) {
            return true;
        }
    }
    
    // Vérifier la période depuis le dernier craquage jusqu'à aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastCrackDate = new Date(crackExpenses[crackExpenses.length - 1].date);
    lastCrackDate.setHours(0, 0, 0, 0);
    
    const daysSinceLastCrack = Math.floor((today - lastCrackDate) / (1000 * 60 * 60 * 24));
    
    return daysSinceLastCrack >= targetDays;
}

// Fonction pour calculer le score total
async function calculateTotalScore() {
    try {
        // Récupérer les dépenses
        const storageKey = getExpensesStorageKey();
        const expenses = JSON.parse(localStorage.getItem(storageKey)) || [];
        
        // Calculer les points des badges
        const allBadges = [
            ...BADGES_CONFIG.resistance,
            ...BADGES_CONFIG.savings,
            ...BADGES_CONFIG.positive_balance
        ];
        
        let badgePoints = 0;
        allBadges.forEach(badge => {
            if (badge.condition(expenses)) {
                badgePoints += badge.points;
            }
        });
        
        // Calculer les points des défis (seulement les réussites)
        let challengePoints = 0;
        
        // Essayer de récupérer les défis depuis le serveur
        if (window.authService && window.authService.isUserAuthenticated()) {
            try {
                const user = window.authService.getCurrentUser();
                const response = await fetch(`/api/monthly-challenges/${encodeURIComponent(user.email)}`);
                if (response.ok) {
                    const data = await response.json();
                    // Gérer les deux formats possibles de réponse
                    const challengesData = data.status || data;
                    console.log('🎯 Défis récupérés:', challengesData);
                    Object.values(challengesData).forEach(status => {
                        if (status === 'completed') {
                            challengePoints += 50; // 50 points par défi réussi
                        }
                    });
                }
            } catch (error) {
                console.warn('Impossible de récupérer les défis pour le calcul du score:', error);
            }
        }
        
        const totalScore = badgePoints + challengePoints;
        console.log('📊 Calcul du score total:', {
            badgePoints: badgePoints,
            challengePoints: challengePoints,
            totalScore: totalScore
        });
        
        return totalScore;
        
    } catch (error) {
        console.error('Erreur lors du calcul du score total:', error);
        return 0;
    }
}

// La régénération des défis est maintenant gérée côté serveur
// Les défis sont automatiquement créés lors de la première visite du mois



// Fonction pour rafraîchir les badges (appelée quand les données changent)
async function refreshBadges() {
    const bonusGrid = document.getElementById('bonus-badges-grid');
    if (!bonusGrid) return;
    
    // Sauvegarder l'état actuel des badges
    const currentBadges = {};
    bonusGrid.querySelectorAll('.badge-placeholder').forEach(badge => {
        const badgeId = badge.dataset.badgeId;
        const isEarned = badge.dataset.earned === 'true';
        currentBadges[badgeId] = isEarned;
    });
    
    // Recharger les badges
    await loadBadges();
    await updateBadgeStats();
    
    // Vérifier les nouveaux badges débloqués
    bonusGrid.querySelectorAll('.badge-placeholder').forEach(badge => {
        const badgeId = badge.dataset.badgeId;
        const isEarned = badge.dataset.earned === 'true';
        
        // Si le badge était verrouillé et est maintenant débloqué
        if (!currentBadges[badgeId] && isEarned) {
            // Animation spéciale pour le nouveau badge
            badge.style.animation = 'badgeUnlock 0.8s ease-out';
            
            // Ajouter un effet de particules ou de confettis
            setTimeout(() => {
                createConfettiExplosion();
            }, 400);
            
            console.log(`🎉 Nouveau badge débloqué: ${badgeId}`);
        }
    });
}

// Fonctions pour le carrousel
function moveCarousel(direction) {
    const carousel = document.getElementById('badges-carousel');
    const badges = document.querySelectorAll('.badge-placeholder');
    const totalBadges = badges.length;
    
    if (totalBadges === 0) return;
    
    // Calculer le nombre total de pages
    const totalPages = Math.ceil(totalBadges / badgesPerView);
    
    // Mettre à jour l'index
    currentCarouselIndex += direction;
    
    // Gérer les limites
    if (currentCarouselIndex < 0) {
        currentCarouselIndex = totalPages - 1;
    } else if (currentCarouselIndex >= totalPages) {
        currentCarouselIndex = 0;
    }
    
    // Calculer la translation
    const translateX = -(currentCarouselIndex * badgesPerView * (300 + 32)); // 300px largeur badge + 32px gap
    
    // Appliquer la translation
    carousel.style.transform = `translateX(${translateX}px)`;
    
    // Mettre à jour les boutons
    updateCarouselControls(totalPages);
    
    // Mettre à jour les indicateurs
    updateCarouselIndicators(totalPages);
}

function updateCarouselControls(totalPages) {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (prevBtn && nextBtn) {
        prevBtn.disabled = totalPages <= 1;
        nextBtn.disabled = totalPages <= 1;
    }
}

function updateCarouselIndicators(totalPages) {
    const indicatorsContainer = document.getElementById('carousel-indicators');
    
    if (!indicatorsContainer) return;
    
    indicatorsContainer.innerHTML = '';
    
    for (let i = 0; i < totalPages; i++) {
        const indicator = document.createElement('div');
        indicator.className = `carousel-indicator ${i === currentCarouselIndex ? 'active' : ''}`;
        indicator.onclick = () => goToCarouselPage(i);
        indicatorsContainer.appendChild(indicator);
    }
}

function goToCarouselPage(pageIndex) {
    const carousel = document.getElementById('badges-carousel');
    const badges = document.querySelectorAll('.badge-placeholder');
    const totalBadges = badges.length;
    const totalPages = Math.ceil(totalBadges / badgesPerView);
    
    if (pageIndex < 0 || pageIndex >= totalPages) return;
    
    currentCarouselIndex = pageIndex;
    
    // Calculer la translation
    const translateX = -(currentCarouselIndex * badgesPerView * (300 + 32));
    
    // Appliquer la translation
    carousel.style.transform = `translateX(${translateX}px)`;
    
    // Mettre à jour les contrôles
    updateCarouselControls(totalPages);
    updateCarouselIndicators(totalPages);
}

function initializeCarousel() {
    const badges = document.querySelectorAll('.badge-placeholder');
    const totalBadges = badges.length;
    const totalPages = Math.ceil(totalBadges / badgesPerView);
    
    // Réinitialiser l'index
    currentCarouselIndex = 0;
    
    // Mettre à jour les contrôles
    updateCarouselControls(totalPages);
    updateCarouselIndicators(totalPages);
    
    // Réinitialiser la position
    const carousel = document.getElementById('badges-carousel');
    if (carousel) {
        carousel.style.transform = 'translateX(0px)';
    }
}

// Fonctions pour la popup des badges
function openAllBadgesPopup() {
    const popup = document.getElementById('all-badges-popup');
    if (popup) {
        popup.classList.add('active');
        loadAllBadgesInPopup();
    }
}

function closeAllBadgesPopup() {
    const popup = document.getElementById('all-badges-popup');
    if (popup) {
        popup.classList.remove('active');
    }
}

function loadAllBadgesInPopup() {
    const allBadgesGrid = document.getElementById('all-badges-grid');
    if (!allBadgesGrid) return;

    // Vider la grille
    allBadgesGrid.innerHTML = '';

    // Récupérer toutes les dépenses pour vérifier les badges
    const storageKey = getExpensesStorageKey();
    const expenses = JSON.parse(localStorage.getItem(storageKey)) || [];

    // Récupérer tous les badges de la configuration
    const allBadges = [
        ...BADGES_CONFIG.resistance,
        ...BADGES_CONFIG.savings,
        ...BADGES_CONFIG.positive_balance
    ];

    // Créer les éléments pour chaque badge
    allBadges.forEach(badge => {
        const isEarned = badge.condition(expenses);
        const badgeElement = createBadgeElementForPopup(badge, isEarned);
        allBadgesGrid.appendChild(badgeElement);
    });
}

function createBadgeElementForPopup(badgeData, isEarned = false) {
    const badgeDiv = document.createElement('div');
    badgeDiv.className = `badge-placeholder ${isEarned ? 'earned' : 'locked'}`;
    badgeDiv.setAttribute('data-badge-id', badgeData.id);

    const statusClass = isEarned ? 'earned' : 'locked';
    const statusText = isEarned ? 'Débloqué' : 'Verrouillé';

    badgeDiv.innerHTML = `
        <div class="badge-icon">
            <img src="${badgeData.icon}" alt="${badgeData.title}" loading="lazy">
        </div>
        <h3>${badgeData.title}</h3>
        <p>${badgeData.description}</p>
        <span class="badge-points ${statusClass}">${badgeData.points} pts</span>
        ${!isEarned ? '<div class="badge-locked-overlay">🔒</div>' : ''}
    `;

    return badgeDiv;
}

// Initialisation des événements pour la popup des badges
function initializeBadgesPopup() {
    // Ajouter un événement de clic sur le conteneur des badges (mais pas sur les boutons du carrousel)
    const badgesContainer = document.querySelector('.badges-container');
    if (badgesContainer) {
        badgesContainer.addEventListener('click', (e) => {
            // Vérifier que le clic n'est pas sur les boutons du carrousel
            if (!e.target.closest('.carousel-controls') && 
                !e.target.closest('.carousel-indicators') &&
                !e.target.closest('.carousel-btn')) {
                openAllBadgesPopup();
            }
        });
    }

    // Événement pour fermer la popup
    const closeBtn = document.getElementById('close-all-badges-popup');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeAllBadgesPopup);
    }

    // Fermer en cliquant à l'extérieur
    const popup = document.getElementById('all-badges-popup');
    if (popup) {
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                closeAllBadgesPopup();
            }
        });
    }
}

// Fonctions pour le système d'avatar
async function initializeAvatarSystem() {
    // Charger l'avatar actuel
    await loadCurrentAvatar();
    
    // Ajouter l'événement pour fermer la popup
    const closeAvatarBtn = document.getElementById('close-avatar-popup');
    if (closeAvatarBtn) {
        closeAvatarBtn.addEventListener('click', closeAvatarPopup);
    }
    
    // Fermer en cliquant à l'extérieur
    const avatarPopup = document.getElementById('avatar-popup');
    if (avatarPopup) {
        avatarPopup.addEventListener('click', (e) => {
            if (e.target === avatarPopup) {
                closeAvatarPopup();
            }
        });
    }
}

// Fonction globale pour charger l'avatar sur toutes les pages
async function loadGlobalAvatar() {
    const avatarElement = document.querySelector('.user-avatar');
    if (!avatarElement) return;
    
    try {
        // Récupérer l'avatar depuis la base de données
        let currentAvatarId = 'default';
        
        if (window.authService && window.authService.isUserAuthenticated()) {
            const savedAvatar = await window.authService.getData('selectedAvatar');
            if (savedAvatar) {
                currentAvatarId = savedAvatar;
                console.log(`🎭 Avatar global récupéré de la base de données: ${currentAvatarId}`);
            } else {
                console.log(`🎭 Aucun avatar global sauvegardé, utilisation par défaut`);
            }
        } else {
            console.log(`🎭 Utilisateur non connecté, avatar global par défaut`);
        }
        
        // Appliquer l'avatar global
        applyGlobalAvatar(avatarElement, currentAvatarId);
        
    } catch (error) {
        console.error('Erreur lors du chargement de l\'avatar global:', error);
        applyGlobalAvatar(avatarElement, 'default');
    }
}

// Fonction pour appliquer l'avatar global
function applyGlobalAvatar(avatarElement, avatarId) {
    if (!avatarElement) return;
    
    const avatar = AVATARS_CONFIG.find(a => a.id === avatarId) || AVATARS_CONFIG[0];
    
    if (avatar.type === 'emoji') {
        avatarElement.textContent = avatar.image;
        avatarElement.style.backgroundImage = 'none';
        avatarElement.style.fontSize = '1.5rem';
        avatarElement.style.display = 'flex';
        avatarElement.style.alignItems = 'center';
        avatarElement.style.justifyContent = 'center';
    } else {
        avatarElement.textContent = '';
        avatarElement.style.backgroundImage = `url(${avatar.image})`;
        avatarElement.style.backgroundSize = 'cover';
        avatarElement.style.backgroundPosition = 'center';
        avatarElement.style.fontSize = '0';
        avatarElement.style.display = 'block';
    }
    
    console.log(`🎭 Avatar global appliqué: ${avatar.name}`);
}

async function loadCurrentAvatar() {
    const avatarElement = document.getElementById('user-avatar');
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    
    if (!avatarElement) return;
    
    try {
        // Récupérer l'avatar depuis la base de données
        let currentAvatarId = 'default';
        
        if (window.authService && window.authService.isUserAuthenticated()) {
            const savedAvatar = await window.authService.getData('selectedAvatar');
            if (savedAvatar) {
                currentAvatarId = savedAvatar;
                console.log(`🎭 Avatar récupéré de la base de données: ${currentAvatarId}`);
            } else {
                console.log(`🎭 Aucun avatar sauvegardé, utilisation par défaut`);
            }
        } else {
            console.log(`🎭 Utilisateur non connecté, avatar par défaut`);
        }
        
        // Appliquer l'avatar
        applyAvatar(currentAvatarId);
        
        // Vérifier si l'utilisateur peut changer d'avatar
        await checkAvatarUnlockStatus();
        
    } catch (error) {
        console.error('Erreur lors du chargement de l\'avatar:', error);
        applyAvatar('default');
    }
}

async function checkAvatarUnlockStatus() {
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    if (!changeAvatarBtn) return;
    
    try {
        // Calculer le niveau actuel
        const totalScore = await calculateTotalScore();
        const currentLevel = calculateLevel(totalScore);
        
        // Vérifier si l'utilisateur a le niveau requis (niveau 3)
        if (currentLevel >= 3) {
            changeAvatarBtn.style.display = 'block';
            changeAvatarBtn.classList.remove('locked');
            changeAvatarBtn.onclick = openAvatarPopup;
            console.log('🎭 Changement d\'avatar débloqué (niveau 3+)');
        } else {
            changeAvatarBtn.style.display = 'block';
            changeAvatarBtn.classList.add('locked');
            changeAvatarBtn.onclick = showAvatarLockedMessage;
            console.log('🔒 Changement d\'avatar verrouillé (niveau requis: 3)');
        }
        
    } catch (error) {
        console.error('Erreur lors de la vérification du statut d\'avatar:', error);
        changeAvatarBtn.style.display = 'block';
        changeAvatarBtn.classList.add('locked');
        changeAvatarBtn.onclick = showAvatarLockedMessage;
    }
}

function showAvatarLockedMessage() {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.className = 'avatar-locked-notification';
    notification.innerHTML = `
        <div class="avatar-locked-content">
            <div class="avatar-locked-icon">🔒</div>
            <div class="avatar-locked-text">
                <h3>Fonctionnalité verrouillée</h3>
                <p>Disponible au niveau 3</p>
            </div>
        </div>
    `;
    
    // Ajouter au body
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 3000);
}

function applyAvatar(avatarId) {
    const avatarElement = document.getElementById('user-avatar');
    if (!avatarElement) return;
    
    const avatar = AVATARS_CONFIG.find(a => a.id === avatarId) || AVATARS_CONFIG[0];
    
    if (avatar.type === 'emoji') {
        avatarElement.textContent = avatar.image;
        avatarElement.style.backgroundImage = 'none';
        avatarElement.style.fontSize = '3rem';
    } else {
        avatarElement.textContent = '';
        avatarElement.style.backgroundImage = `url(${avatar.image})`;
        avatarElement.style.backgroundSize = 'cover';
        avatarElement.style.backgroundPosition = 'center';
        avatarElement.style.fontSize = '0';
    }
    
    console.log(`🎭 Avatar appliqué: ${avatar.name}`);
}

function openAvatarPopup() {
    const popup = document.getElementById('avatar-popup');
    const avatarsGrid = document.getElementById('avatars-grid');
    
    if (!popup || !avatarsGrid) return;
    
    // Vider la grille
    avatarsGrid.innerHTML = '';
    
    // Calculer le niveau actuel
    calculateTotalScore().then(totalScore => {
        const currentLevel = calculateLevel(totalScore);
        
        // Créer les options d'avatar
        AVATARS_CONFIG.forEach(avatar => {
            const isUnlocked = !avatar.unlockLevel || currentLevel >= avatar.unlockLevel;
            const avatarOption = createAvatarOption(avatar, isUnlocked, currentLevel);
            avatarsGrid.appendChild(avatarOption);
        });
        
        // Ajouter le bouton de sélection
        const selectBtn = document.createElement('button');
        selectBtn.className = 'avatar-select-btn';
        selectBtn.textContent = 'Sélectionner cet avatar';
        selectBtn.onclick = selectCurrentAvatar;
        avatarsGrid.appendChild(selectBtn);
        
        // Afficher la popup
        popup.classList.add('active');
    });
}

function createAvatarOption(avatar, isUnlocked, currentLevel) {
    const option = document.createElement('div');
    option.className = `avatar-option ${isUnlocked ? '' : 'locked'}`;
    option.dataset.avatarId = avatar.id;
    
    if (isUnlocked) {
        option.onclick = () => selectAvatarOption(avatar.id);
    }
    
    let content = '';
    
    if (avatar.type === 'emoji') {
        content = `
            <div style="font-size: 3rem; margin-bottom: 10px;">${avatar.image}</div>
            <div class="avatar-name">${avatar.name}</div>
        `;
    } else {
        content = `
            <img src="${avatar.image}" alt="${avatar.name}" loading="lazy">
            <div class="avatar-name">${avatar.name}</div>
        `;
    }
    
    if (!isUnlocked) {
        content += `
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; border-radius: 12px;">
                <div style="text-align: center; color: white;">
                    <div style="font-size: 1.5rem; margin-bottom: 5px;">🔒</div>
                    <div style="font-size: 0.7rem;">Niveau ${avatar.unlockLevel}</div>
                </div>
            </div>
        `;
    }
    
    option.innerHTML = content;
    return option;
}

function selectAvatarOption(avatarId) {
    // Retirer la sélection précédente
    document.querySelectorAll('.avatar-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Sélectionner la nouvelle option
    const selectedOption = document.querySelector(`[data-avatar-id="${avatarId}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
    
    // Mettre à jour le bouton de sélection
    const selectBtn = document.querySelector('.avatar-select-btn');
    if (selectBtn) {
        selectBtn.disabled = false;
    }
}

async function selectCurrentAvatar() {
    const selectedOption = document.querySelector('.avatar-option.selected');
    if (!selectedOption) {
        alert('Veuillez sélectionner un avatar');
        return;
    }
    
    const avatarId = selectedOption.dataset.avatarId;
    
    try {
        // Sauvegarder la sélection dans la base de données
        if (window.authService && window.authService.isUserAuthenticated()) {
            const success = await window.authService.saveData('selectedAvatar', avatarId);
            if (success) {
                console.log(`🎭 Avatar sauvegardé dans la base de données: ${avatarId}`);
            } else {
                throw new Error('Échec de la sauvegarde dans la base de données');
            }
        } else {
            throw new Error('Utilisateur non connecté');
        }
        
        // Appliquer l'avatar
        applyAvatar(avatarId);
        
        // Fermer la popup
        closeAvatarPopup();
        
        // Créer une explosion de confettis pour célébrer
        createConfettiExplosion();
        
        console.log(`🎭 Avatar sélectionné et sauvegardé: ${avatarId}`);
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'avatar:', error);
        alert('Erreur lors de la sauvegarde de l\'avatar. Veuillez réessayer.');
    }
}

function closeAvatarPopup() {
    const popup = document.getElementById('avatar-popup');
    if (popup) {
        popup.classList.remove('active');
    }
}

// Export des fonctions pour utilisation dans d'autres fichiers
window.RPGhetto = {
    addBadge,
    updateBadgeStats,
    calculateTotalScore,
    loadMonthlyChallenges,
    refreshBadges,
    openAllBadgesPopup,
    closeAllBadgesPopup,
    initializeAvatarSystem,
    loadCurrentAvatar,
    applyAvatar
};

// Exporter les fonctions d'avatar global pour toutes les pages
window.loadGlobalAvatar = loadGlobalAvatar;
window.applyGlobalAvatar = applyGlobalAvatar;
window.AVATARS_CONFIG = AVATARS_CONFIG;

// Exporter les fonctions du carrousel
window.moveCarousel = moveCarousel;
window.goToCarouselPage = goToCarouselPage;
window.initializeCarousel = initializeCarousel; 