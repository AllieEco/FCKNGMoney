// Dashboard JavaScript pour FCKNGMoney
let selectedPeriod = 'year'; // Période par défaut

document.addEventListener('DOMContentLoaded', async function() {
    // Charger la configuration utilisateur
    if (window.authService) {
        config = await window.authService.getUserConfig();
    }
    
    // Initialiser l'authentification
    initAuth();
    
    // Initialiser les boutons de sélection de période
    initPeriodSelector();
    
    await loadDashboardData();
    initQuotesCarousel();
    
    // Écouter les événements de déconnexion
    window.addEventListener('userLogout', () => {
        // Recharger les données pour l'utilisateur local
        loadDashboardData();
    });
});

// Citations politiques
const politicalQuotes = [
    {
        text: "Un pain au chocolat à 10 ou 15 centimes",
        author: "Jean-François Copé (2012)"
    },
    {
        text: "Il suffit de traverser la rue pour trouver du travail",
        author: "Emmanuel Macron"
    },
    {
        text: "Mon ennemi, c'est la finance",
        author: "François Hollande"
    },
    {
        text: "Les riches, il faut les aimer",
        author: "Gérald Darmanin"
    },
    {
        text: "L'argent magique",
        author: "Jean-Luc Mélenchon"
    },
    {
        text: "Avec 1200€, on vit très bien",
        author: "Xavier Bertrand"
    },
    {
        text: "Il faut arrêter d'aider les pauvres, ça les maintient dans la pauvreté",
        author: "Valérie Pécresse"
    },
    {
        text: "Il faut que les Français consomment plus",
        author: "Christine Lagarde"
    },
    {
        text: "Les Français ne savent plus compter",
        author: "Claire Chazal"
    },
    {
        text: "L'économie, c'est comme la météo",
        author: "Laurence Ferrari"
    },
    {
        text: "Moi j'ai jamais eu de problèmes d'argent",
        author: "Cyril Hanouna"
    },
    {
        text: "Les inégalités, c'est pas grave",
        author: "Alain Minc"
    },
    {
        text: "L'argent ne fait pas le bonheur",
        author: "Un mec riche"
    },
    {
        text: "L'argent n'a pas d'odeur",
        author: "Vincent Bolloré"
    },
    {
        text: "Je ne regarde jamais les prix",
        author: "Bernard-Henri Lévy"
    },
    {
        text: "J'ai toujours préféré les passes aux euros",
        author: "Zinedine Zidane"
    }
];

function initPeriodSelector() {
    const periodButtons = document.querySelectorAll('.period-btn');
    
    periodButtons.forEach(button => {
        button.addEventListener('click', () => {
            const period = button.dataset.period;
            
            // Mettre à jour la période sélectionnée
            selectedPeriod = period;
            
            // Mettre à jour l'état actif des boutons
            periodButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Recharger les données du tableau de bord avec la nouvelle période
            loadDashboardData();
        });
    });
}

function initQuotesCarousel() {
    const quoteContent = document.getElementById('quote-content');
    const quoteAuthor = document.getElementById('quote-author');
    
    function showRandomQuote() {
        const randomIndex = Math.floor(Math.random() * politicalQuotes.length);
        const quote = politicalQuotes[randomIndex];
        
        // Effet de fade out
        quoteContent.style.opacity = '0';
        quoteAuthor.style.opacity = '0';
        
        setTimeout(() => {
            quoteContent.textContent = quote.text;
            quoteAuthor.textContent = quote.author;
            
            // Effet de fade in
            quoteContent.style.opacity = '1';
            quoteAuthor.style.opacity = '1';
        }, 500);
    }
    
    // Afficher une citation au chargement
    showRandomQuote();
    
    // Changer de citation toutes les 8 secondes
    setInterval(showRandomQuote, 8000);
}

// Fonction pour obtenir la clé de stockage spécifique à l'utilisateur
function getExpensesStorageKey() {
    if (window.authService && window.authService.isUserAuthenticated()) {
        const user = window.authService.getCurrentUser();
        return `expenses_${user.email}`;
    }
    return 'expenses_local'; // Pour les utilisateurs non connectés
}

// Fonction pour gérer la déconnexion
function handleLogout() {
    // Déconnecter l'utilisateur (les données sont conservées)
    window.authService.logout();
    
    // Recharger les données pour l'utilisateur local
    loadDashboardData();
    
    // Mettre à jour l'interface
    updateAuthButton();
}

async function loadDashboardData() {
    // Vérifier si l'utilisateur est connecté
    const isAuthenticated = window.authService && window.authService.isUserAuthenticated();
    
    // Récupérer les données depuis le bon stockage
    const storageKey = getExpensesStorageKey();
    const expenses = JSON.parse(localStorage.getItem(storageKey)) || [];
    
    // Calculer les données du tableau de bord
    const dashboardData = await calculateDashboardData(expenses);
    
    // Mettre à jour l'affichage
    await updateDashboardDisplay(dashboardData);
    
    // Calculer et afficher les stats de criminels financiers seulement si connecté
    if (isAuthenticated) {
        updateCriminalStats(expenses);
        // Créer les graphiques seulement si connecté
        await createCharts(expenses);
    } else {
        // Réinitialiser les stats si non connecté
        updateCriminalStats([]);
        // Masquer ou réinitialiser les graphiques
        await createCharts([]);
    }
}

// Fonction d'initialisation de l'authentification (copiée depuis rpghetto.js)
function initAuth() {
    const authBtn = document.getElementById('auth-btn');
    const authPopup = document.getElementById('auth-popup');
    const authClose = document.getElementById('auth-close');
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // Mettre à jour l'état du bouton selon la connexion
    updateAuthButton();
    
    // Charger l'avatar après l'initialisation de l'authentification
    setTimeout(async () => {
        if (window.applyGlobalAvatar && window.AVATARS_CONFIG) {
            const authBtn = document.getElementById('auth-btn');
            const avatarElement = authBtn.querySelector('.user-avatar');
            if (avatarElement) {
                try {
                    let currentAvatarId = 'default';
                    
                    if (window.authService && window.authService.isUserAuthenticated()) {
                        const savedAvatar = await window.authService.getData('selectedAvatar');
                        if (savedAvatar) {
                            currentAvatarId = savedAvatar;
                        }
                    } else {
                        currentAvatarId = localStorage.getItem('selectedAvatar_local') || 'default';
                    }
                    
                    window.applyGlobalAvatar(avatarElement, currentAvatarId);
                    console.log('🎭 Avatar initialisé sur dashboard:', currentAvatarId);
                } catch (error) {
                    console.error('Erreur lors de l\'initialisation de l\'avatar:', error);
                }
            }
        }
    }, 500);
    
    // Configurer la validation du mot de passe
    setupPasswordValidation();
    
    // Ouvrir la popup d'authentification
    authBtn.addEventListener('click', () => {
        if (!window.authService.isUserAuthenticated()) {
            // Si non connecté, ouvrir la popup
            authPopup.classList.add('active');
        }
        // Si connecté, le menu s'ouvre via les événements du menu utilisateur
    });
    
    // Fermer la popup
    authClose.addEventListener('click', () => {
        authPopup.classList.remove('active');
        clearAuthMessages();
    });
    
    // Fermer en cliquant à l'extérieur
    authPopup.addEventListener('click', (e) => {
        if (e.target === authPopup) {
            authPopup.classList.remove('active');
            clearAuthMessages();
        }
    });
    
    // Gestion des onglets
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Mettre à jour les onglets actifs
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Afficher le bon formulaire
            if (targetTab === 'login') {
                loginForm.style.display = 'block';
                registerForm.style.display = 'none';
            } else {
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
            }
            
            clearAuthMessages();
        });
    });
    
    // Gestion du formulaire de connexion
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        const submitBtn = loginForm.querySelector('.auth-submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Connexion...';
        
        try {
            const result = await window.authService.login(email, password);
            
            if (result.success) {
                showAuthMessage('🎉 Connexion réussie ! Bienvenue dans le club des dépensiers !', 'success');
                updateAuthButton();
                
                // Charger les données depuis le serveur
                await window.authService.loadServerData();
                
                // Recharger le dashboard avec les données synchronisées
                await loadDashboardData();
                
                setTimeout(() => {
                    authPopup.classList.remove('active');
                    clearAuthMessages();
                }, 1500);
            } else {
                showAuthMessage(result.message, 'error');
            }
        } catch (error) {
            showAuthMessage('💥 Erreur de connexion - Le serveur fait la grève', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Se Connecter';
        }
    });
    
    // Gestion du formulaire d'inscription
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;
        const uniqueId = document.getElementById('register-unique-id').value;
        
        // Validation du mot de passe
        if (!validatePassword(password)) {
            showAuthMessage('🤦 Ton mot de passe est trop faible ! Respecte les règles !', 'error');
            return;
        }
        
        // Vérification de la confirmation du mot de passe
        if (password !== passwordConfirm) {
            showAuthMessage('🤔 Les mots de passe ne correspondent pas - Tu sais pas taper ?', 'error');
            return;
        }
        
        const submitBtn = registerForm.querySelector('.auth-submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Inscription...';
        
        try {
            // Vérifier si l'identifiant unique est disponible
            const isAvailable = await window.authService.checkUniqueId(uniqueId);
            if (!isAvailable) {
                showAuthMessage('😤 Cet identifiant est déjà pris ! Sois plus original !', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'S\'inscrire';
                return;
            }
            
            const result = await window.authService.register(email, password, uniqueId);
            
            if (result.success) {
                showAuthMessage('🎉 Inscription réussie ! Bienvenue dans la famille des dépensiers !', 'success');
                updateAuthButton();
                
                // Synchroniser les données locales avec le serveur
                await window.authService.syncLocalData();
                
                // Recharger le dashboard
                loadDashboardData();
                
                setTimeout(() => {
                    authPopup.classList.remove('active');
                    clearAuthMessages();
                }, 1500);
            } else {
                showAuthMessage(result.message, 'error');
            }
        } catch (error) {
            showAuthMessage('💥 Erreur d\'inscription - Le serveur a encore bu trop de café', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'S\'inscrire';
        }
    });
}

// Fonction pour mettre à jour le bouton d'authentification
function updateAuthButton() {
    const authBtn = document.getElementById('auth-btn');
    
    if (window.authService.isUserAuthenticated()) {
        const user = window.authService.getCurrentUser();
        
        // Créer le menu utilisateur
        authBtn.innerHTML = `
            <div class="user-menu">
                <div class="user-avatar">${user.uniqueId.charAt(0).toUpperCase()}</div>
                <div class="user-menu-dropdown">
                    <div class="user-menu-header">
                        <div class="user-name">${user.uniqueId}</div>
                        <div class="user-email">${user.email}</div>
                    </div>
                    <div class="user-menu-options">
                        <button class="user-menu-option theme-toggle" onclick="toggleTheme();">
                            <span class="icon">🌙</span>
                            <span class="theme-text">Passer en mode clair</span>
                        </button>
                        <button class="user-menu-option daily-chest" onclick="openDailyChest();">
                            <span class="icon">📦</span>
                            Coffre quotidien
                        </button>
                        <button class="user-menu-option logout" onclick="handleLogout();">
                            <span class="icon">🚪</span>
                            Se déconnecter
                        </button>
                        <button class="user-menu-option delete-account" onclick="showDeleteAccountConfirmation()">
                            <span class="icon">🗑️</span>
                            Supprimer mon compte
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Charger l'avatar personnalisé après la création du menu
        setTimeout(async () => {
            if (window.applyGlobalAvatar && window.AVATARS_CONFIG) {
                const avatarElement = authBtn.querySelector('.user-avatar');
                if (avatarElement) {
                    try {
                        // Récupérer l'avatar sauvegardé
                        let currentAvatarId = 'default';
                        
                        if (window.authService && window.authService.isUserAuthenticated()) {
                            const savedAvatar = await window.authService.getData('selectedAvatar');
                            if (savedAvatar) {
                                currentAvatarId = savedAvatar;
                                console.log(`🎭 Avatar dashboard récupéré de la base de données: ${currentAvatarId}`);
                            } else {
                                console.log(`🎭 Aucun avatar dashboard sauvegardé, utilisation par défaut`);
                            }
                        } else {
                            console.log(`🎭 Utilisateur non connecté, avatar dashboard par défaut`);
                        }
                        
                        // Appliquer l'avatar
                        window.applyGlobalAvatar(avatarElement, currentAvatarId);
                        console.log('🎭 Avatar initialisé sur dashboard:', currentAvatarId);
                    } catch (error) {
                        console.error('Erreur lors de l\'initialisation de l\'avatar:', error);
                    }
                }
            }
            
            // Mettre à jour le bouton de thème
            if (typeof window.updateThemeButton === 'function') {
                window.updateThemeButton();
            }
        }, 100);
        authBtn.className = 'auth-btn connected';
        
        // Ajouter les événements pour le menu
        const userMenu = authBtn.querySelector('.user-menu');
        const dropdown = userMenu.querySelector('.user-menu-dropdown');
        
        // Ouvrir/fermer le menu au clic
        userMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });
        
        // Fermer le menu en cliquant ailleurs
        document.addEventListener('click', (e) => {
            if (!userMenu.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
        
    } else {
        authBtn.innerHTML = 'Se Connecter';
        authBtn.className = 'auth-btn';
    }
}

// Fonction pour afficher un message d'authentification
function showAuthMessage(message, type) {
    clearAuthMessages();
    
    const authPopup = document.getElementById('auth-popup');
    const messageDiv = document.createElement('div');
    messageDiv.className = `auth-message ${type}`;
    messageDiv.textContent = message;
    
    authPopup.querySelector('.popup-content').appendChild(messageDiv);
}

// Fonction pour effacer les messages d'authentification
function clearAuthMessages() {
    const messages = document.querySelectorAll('.auth-message');
    messages.forEach(msg => msg.remove());
}

// Fonction pour ouvrir le coffre quotidien
async function openDailyChest() {
    console.log('📦 Fonction coffre quotidien appelée');
    
    // Vérifier si le coffre peut être ouvert
    const chestStatus = await canOpenChest();
    console.log('📦 Statut du coffre:', chestStatus);
    
    if (!chestStatus.canOpen) {
        // Afficher un message d'erreur avec le temps restant
        const timeRemaining = formatTimeRemaining(chestStatus.timeRemaining);
        alert(`⏰ Coffre quotidien non disponible !\n\nIl te reste ${timeRemaining} avant de pouvoir ouvrir un nouveau coffre.`);
        return;
    }
    
    // Créer la popup si elle n'existe pas
    let chestPopup = document.getElementById('daily-chest-popup');
    if (!chestPopup) {
        console.log('📦 Création de la popup du coffre quotidien');
        chestPopup = document.createElement('div');
        chestPopup.id = 'daily-chest-popup';
        chestPopup.className = 'popup-overlay';
        // Déterminer le contenu en fonction du statut du coffre
        const isLocked = !chestStatus.canOpen;
        const timeRemaining = formatTimeRemaining(chestStatus.timeRemaining);
        
        chestPopup.innerHTML = `
            <div class="popup-content daily-chest-popup">
                <div class="popup-header">
                    <h2>📦 ${isLocked ? 'Coffre quotidien verrouillé' : 'Ouvre vite ton coffre quotidien !'}</h2>
                    <button class="popup-close-btn" id="close-daily-chest-popup">×</button>
                </div>
                <div class="chest-content">
                    <div class="chest-icon ${isLocked ? 'locked' : ''}" id="clickable-chest">📦</div>
                    ${isLocked ? `
                        <div class="chest-locked-info">
                            <h3>⏰ Coffre temporairement indisponible</h3>
                            <div class="countdown-timer" id="countdown-timer">
                                <span class="time-remaining">${timeRemaining}</span>
                            </div>
                            <p class="locked-message">Tu pourras ouvrir un nouveau coffre dans :</p>
                        </div>
                    ` : `
                        <div class="chest-rewards">
                            <h3>🎁 Gains possibles :</h3>
                            <div class="rewards-list">
                                <div class="reward-item">
                                    <div class="reward-content">
                                        <span class="reward-points">5 points</span>
                                        <span class="reward-chance">Chance élevée</span>
                                    </div>
                                </div>
                                <div class="reward-item">
                                    <div class="reward-content">
                                        <span class="reward-points">10 points</span>
                                        <span class="reward-chance">Chance moyenne</span>
                                    </div>
                                </div>
                                <div class="reward-item">
                                    <div class="reward-content">
                                        <span class="reward-points">15 points</span>
                                        <span class="reward-chance">Chance rare</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `}
                </div>
            </div>
        `;
        document.body.appendChild(chestPopup);
        
        // Ajouter les événements
        const closeBtn = chestPopup.querySelector('#close-daily-chest-popup');
        
        closeBtn.addEventListener('click', () => {
            console.log('📦 Fermeture de la popup du coffre');
            chestPopup.classList.remove('active');
        });
        
        // Fermer en cliquant à l'extérieur
        chestPopup.addEventListener('click', (e) => {
            if (e.target === chestPopup) {
                chestPopup.classList.remove('active');
            }
        });
        
                    // Gérer le clic sur le coffre
            const clickableChest = chestPopup.querySelector('#clickable-chest');
            if (!isLocked) {
                clickableChest.addEventListener('click', () => {
                    openChest(chestPopup);
                });
            }
            
            // Démarrer le compteur si le coffre est verrouillé
            if (isLocked) {
                startCountdownTimer(chestPopup, chestStatus.timeRemaining);
            }
    }
    
    // Afficher la popup
    console.log('📦 Affichage de la popup du coffre');
    chestPopup.classList.add('active');
}

// Fonction de validation du mot de passe
function validatePassword(password) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && password.length >= 8;
}

// Fonction pour valider le mot de passe en temps réel
function setupPasswordValidation() {
    const passwordInput = document.getElementById('register-password');
    const passwordConfirmInput = document.getElementById('register-password-confirm');
    const requirementsElement = document.querySelector('.password-requirements');
    
    if (passwordInput && requirementsElement) {
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const isValid = validatePassword(password);
            
            if (isValid) {
                requirementsElement.classList.add('valid');
                requirementsElement.textContent = '✅ Mot de passe valide';
            } else {
                requirementsElement.classList.remove('valid');
                requirementsElement.textContent = 'Doit contenir : 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial';
            }
        });
    }
    
    if (passwordConfirmInput && passwordInput) {
        passwordConfirmInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const passwordConfirm = passwordConfirmInput.value;
            
            if (passwordConfirm && password !== passwordConfirm) {
                passwordConfirmInput.style.borderColor = '#ef4444';
            } else if (passwordConfirm) {
                passwordConfirmInput.style.borderColor = '#10b981';
            } else {
                passwordConfirmInput.style.borderColor = '';
            }
        });
    }
}

async function calculateDashboardData(expenses) {
    const currentDate = new Date();
    currentDate.setHours(23, 59, 59, 999); // On inclut toute la journée en cours
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Vérifier si l'utilisateur est connecté
    const isAuthenticated = window.authService && window.authService.isUserAuthenticated();
    
    // Si non connecté, retourner des valeurs par défaut
    if (!isAuthenticated) {
        return {
            balance: 0,
            periodCracks: 0,
            unnecessarySpending: 0
        };
    }
    
    // Récupérer la configuration utilisateur
    let userConfig = config;
    if (window.authService) {
        userConfig = await window.authService.getUserConfig();
    }
    
    // Utiliser le solde initial de la config + les transactions jusqu'à aujourd'hui
    let totalBalance = userConfig.initialBalance || 0;
    let periodCracks = 0;
    let unnecessarySpending = 0;
    
    // Calculer les dates de début et fin selon la période sélectionnée
    const { startDate, endDate } = getPeriodDates(selectedPeriod);
    
    // Filtrer les transactions jusqu'à aujourd'hui uniquement
    const filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate <= currentDate;
    });
    
    filteredExpenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        const amount = parseFloat(expense.amount);
        
        // Calculer le solde total (toujours sur toute la période jusqu'à aujourd'hui)
        if (expense.type === 'income') {
            totalBalance += amount;
        } else {
            totalBalance += amount; // Les dépenses sont déjà négatives dans le stockage
        }
        
        // Compter les craquages selon la période sélectionnée
        if (
            expenseDate >= startDate && 
            expenseDate <= endDate &&
            expenseDate <= currentDate &&
            expense.type === 'expense' &&
            expense.necessity === 'Pose pas de questions qui fâchent'
        ) {
            periodCracks++;
        }
        
        // Calculer les dépenses inutiles selon la période sélectionnée
        if (
            expenseDate >= startDate && 
            expenseDate <= endDate &&
            expenseDate <= currentDate &&
            expense.necessity === 'Pose pas de questions qui fâchent' && 
            expense.type === 'expense'
        ) {
            unnecessarySpending += Math.abs(amount); // Utiliser la valeur absolue pour l'affichage
        }
    });
    
    return {
        balance: totalBalance,
        periodCracks: periodCracks,
        unnecessarySpending: unnecessarySpending
    };
}

// Fonction pour calculer les dates de début et fin selon la période
function getPeriodDates(period) {
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
        case 'week':
            // Semaine en cours (lundi au dimanche)
            const dayOfWeek = now.getDay();
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0 = dimanche
            startDate = new Date(now);
            startDate.setDate(now.getDate() - daysToMonday);
            startDate.setHours(0, 0, 0, 0);
            
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            break;
            
        case 'month':
            // Mois en cours
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
            
        case 'year':
        default:
            // Année en cours
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            break;
    }
    
    return { startDate, endDate };
}

async function updateDashboardDisplay(data) {
    // Mettre à jour l'état du compte
    await updateAccountStatus(data.balance);
    
    // Mettre à jour le nombre de craquages
    updatePeriodCracks(data.periodCracks);
    
    // Mettre à jour les dépenses inutiles
    updateUnnecessarySpending(data.unnecessarySpending);
}

async function updateAccountStatus(balance) {
    const balanceElement = document.getElementById('current-balance');
    const messageElement = document.getElementById('balance-message');
    const cardElement = document.getElementById('account-status-card');
    
    // Vérifier si l'utilisateur est connecté
    const isAuthenticated = window.authService && window.authService.isUserAuthenticated();
    
    if (!isAuthenticated) {
        // Si non connecté, afficher un message d'invitation
        balanceElement.textContent = '0.00€';
        messageElement.textContent = 'Connecte-toi pour voir tes finances !';
        cardElement.className = 'dashboard-card';
        return;
    }
    
    // Formater le solde
    balanceElement.textContent = `${balance.toFixed(2)}€`;
    
    // Récupérer la configuration utilisateur
    let userConfig = config;
    if (window.authService) {
        userConfig = await window.authService.getUserConfig();
    }
    
    // Utiliser les seuils de la config ou les valeurs par défaut
    const warningThreshold = userConfig.warningThreshold || 200;
    const dangerThreshold = userConfig.dangerThreshold || 0;
    
    // Déterminer le message et la classe CSS selon le solde
    let message = '';
    let statusClass = '';
    
    if (balance > warningThreshold) {
        message = userConfig.customMessages?.positive || "C'est bon on est laaaaarge";
        statusClass = 'positive';
    } else if (balance >= dangerThreshold) {
        message = userConfig.customMessages?.warning || "Fais gaffe à pas pousser le bouchon trop loin";
        statusClass = 'warning';
    } else {
        message = userConfig.customMessages?.danger || "OSKOUR !";
        statusClass = 'danger';
    }
    
    messageElement.textContent = message;
    
    // Appliquer la classe CSS pour les couleurs
    cardElement.className = `dashboard-card ${statusClass}`;
}

function updatePeriodCracks(cracksCount) {
    const cracksElement = document.getElementById('monthly-cracks');
    const messageElement = document.getElementById('cracks-message');
    const cardElement = document.getElementById('monthly-cracks-card');
    const titleElement = document.getElementById('cracks-title');
    
    // Vérifier si l'utilisateur est connecté
    const isAuthenticated = window.authService && window.authService.isUserAuthenticated();
    
    if (!isAuthenticated) {
        // Si non connecté, afficher un message d'invitation
        cracksElement.textContent = '0';
        messageElement.textContent = 'Connecte-toi pour voir tes craquages !';
        cardElement.className = 'dashboard-card';
        return;
    }
    
    // Mettre à jour le titre selon la période
    switch (selectedPeriod) {
        case 'week':
            titleElement.textContent = 'Craquages de la Semaine';
            break;
        case 'month':
            titleElement.textContent = 'Craquages du Mois';
            break;
        case 'year':
        default:
            titleElement.textContent = 'Craquages de l\'Année';
            break;
    }
    
    cracksElement.textContent = cracksCount;
    
    // Déterminer le message selon le nombre de craquages et la période
    let message = '';
    let statusClass = '';
    
    // Seuils adaptés selon la période
    let lowThreshold, mediumThreshold, highThreshold;
    switch (selectedPeriod) {
        case 'week':
            lowThreshold = 2;
            mediumThreshold = 3;
            highThreshold = 4; // Rouge à partir de 4 craquages par semaine
            break;
        case 'month':
            lowThreshold = 8;
            mediumThreshold = 15;
            highThreshold = 19; // Rouge à partir de 19 craquages par mois
            break;
        case 'year':
        default:
            lowThreshold = 40;
            mediumThreshold = 70;
            highThreshold = 100; // Rouge à partir de 100 craquages par an
            break;
    }
    
    // Messages variés selon le niveau de craquage
    const lowMessages = [
        "😌 Pas mal, tu te tiens encore !",
        "💪 Tu résistes bien à la tentation !",
        "🏆 Continue comme ça, champion !",
        "🧘 Tu maîtrises tes pulsions !"
    ];
    
    const mediumMessages = [
        "😅 Bon, ça commence à faire beaucoup là...",
        "🤔 Tu te lâches un peu trop non ?",
        "⚠️ Attention, ça part en couille !",
        "😬 Tu devrais peut-être te calmer..."
    ];
    
    const highMessages = [
        "😱 Tu as un problème avec l'argent ou quoi ?",
        "🤯 Tu es complètement dingue ou quoi ?!",
        "🏚️ Tu veux vraiment finir à la rue ?",
        "🏦 Ton banquier va te remercier..."
    ];
    
    if (cracksCount === 0) {
        message = `Bravo ! Tu as tenu bon ${getPeriodText()} !`;
        statusClass = 'low';
    } else if (cracksCount <= lowThreshold) {
        message = lowMessages[Math.floor(Math.random() * lowMessages.length)];
        statusClass = 'low';
    } else if (cracksCount <= mediumThreshold) {
        message = mediumMessages[Math.floor(Math.random() * mediumMessages.length)];
        statusClass = 'medium';
    } else if (cracksCount <= highThreshold) {
        message = highMessages[Math.floor(Math.random() * highMessages.length)];
        statusClass = 'high';
    } else {
        message = highMessages[Math.floor(Math.random() * highMessages.length)];
        statusClass = 'high';
    }
    
    messageElement.textContent = message;
    
    // Appliquer la classe CSS pour les couleurs
    cardElement.className = `dashboard-card ${statusClass}`;
}

// Fonction pour obtenir le texte de la période
function getPeriodText() {
    switch (selectedPeriod) {
        case 'week':
            return 'cette semaine';
        case 'month':
            return 'ce mois-ci';
        case 'year':
        default:
            return 'cette année';
    }
}

function updateUnnecessarySpending(total) {
    const amountElement = document.getElementById('unnecessary-total');
    const messageElement = document.getElementById('unnecessary-message');
    
    // Vérifier si l'utilisateur est connecté
    const isAuthenticated = window.authService && window.authService.isUserAuthenticated();
    
    if (!isAuthenticated) {
        // Si non connecté, afficher un message d'invitation
        amountElement.textContent = '0.00€';
        messageElement.textContent = 'Connecte-toi pour voir tes dépenses !';
        return;
    }
    
    amountElement.textContent = `${total.toFixed(2)}€`;
    
    // Le message reste toujours le même comme demandé
    messageElement.textContent = "Tu vois si t'arrêtais tes conneries...";
}

// Fonction pour rafraîchir les données (peut être appelée depuis d'autres pages)
function refreshDashboard() {
    loadDashboardData();
}

function updateCriminalStats(expenses) {
    // Vérifier si l'utilisateur est connecté
    const isAuthenticated = window.authService && window.authService.isUserAuthenticated();
    
    if (!isAuthenticated) {
        // Si non connecté, afficher des valeurs par défaut
        document.getElementById('days-without-crack').textContent = '0';
        document.getElementById('biggest-expense').textContent = '0.00€';
        document.getElementById('improvement').textContent = '0.0%';
        return;
    }
    
    // Calculer les jours sans craquage
    const daysWithoutCrack = calculateDaysWithoutCrack(expenses);
    
    // Calculer la plus grosse dépense de la période
    const biggestExpense = calculateBiggestExpenseThisPeriod(expenses);
    
    // Calculer l'amélioration vs période précédente
    const improvement = calculateImprovementVsLastPeriod(expenses);
    
    // Mettre à jour l'affichage
    document.getElementById('days-without-crack').textContent = daysWithoutCrack;
    document.getElementById('biggest-expense').textContent = `${biggestExpense.toFixed(2)}€`;
    document.getElementById('improvement').textContent = `${improvement.toFixed(1)}%`;
    
    // Mettre à jour les descriptions selon la période
    const biggestExpenseDesc = document.getElementById('biggest-expense-desc');
    const improvementDesc = document.getElementById('improvement-desc');
    
    switch (selectedPeriod) {
        case 'week':
            biggestExpenseDesc.textContent = 'cette semaine';
            improvementDesc.textContent = 'vs semaine dernière';
            break;
        case 'month':
            biggestExpenseDesc.textContent = 'ce mois-ci';
            improvementDesc.textContent = 'vs mois dernier';
            break;
        case 'year':
        default:
            biggestExpenseDesc.textContent = 'cette année';
            improvementDesc.textContent = 'vs année dernière';
            break;
    }
}

function calculateDaysWithoutCrack(expenses) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Filtrer les dépenses (pas les revenus)
    const expenseOnly = expenses.filter(exp => exp.type === 'expense');
    
    if (expenseOnly.length === 0) {
        return 0; // Pas de dépenses du tout
    }
    
    // Trier par date décroissante
    expenseOnly.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Prendre la dernière dépense
    const lastExpenseDate = new Date(expenseOnly[0].date);
    const lastExpenseDay = new Date(lastExpenseDate.getFullYear(), lastExpenseDate.getMonth(), lastExpenseDate.getDate());
    
    // Calculer la différence en jours
    const diffTime = today.getTime() - lastExpenseDay.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
}

function calculateBiggestExpenseThisPeriod(expenses) {
    const { startDate, endDate } = getPeriodDates(selectedPeriod);
    
    // Filtrer les dépenses de la période sélectionnée
    const periodExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= startDate && 
               expDate <= endDate && 
               exp.type === 'expense'; // Seulement les dépenses
    });
    
    if (periodExpenses.length === 0) {
        return 0;
    }
    
    // Trouver la plus grosse dépense (valeur absolue la plus élevée)
    const biggest = periodExpenses.reduce((max, exp) => {
        return Math.abs(exp.amount) > Math.abs(max.amount) ? exp : max;
    });
    
    return Math.abs(biggest.amount);
}

function calculateImprovementVsLastPeriod(expenses) {
    const { startDate, endDate } = getPeriodDates(selectedPeriod);
    
    // Calculer le total de la période actuelle
    const currentPeriodTotal = expenses
        .filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= startDate && expDate <= endDate;
        })
        .reduce((sum, exp) => sum + exp.amount, 0);
    
    // Calculer les dates de la période précédente
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate.getTime() - 1); // Juste avant le début de la période actuelle
    
    // Calculer le total de la période précédente
    const previousPeriodTotal = expenses
        .filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= previousStartDate && expDate <= previousEndDate;
        })
        .reduce((sum, exp) => sum + exp.amount, 0);
    
    // Calculer le pourcentage d'amélioration
    if (previousPeriodTotal === 0) {
        // Si pas de données la période précédente, on ne peut pas calculer de pourcentage
        return currentPeriodTotal > 0 ? 100 : 0;
    }
    
    const percentageChange = ((currentPeriodTotal - previousPeriodTotal) / Math.abs(previousPeriodTotal)) * 100;
    return percentageChange;
}

async function createCharts(expenses) {
    await createBalanceChart(expenses);
    createExpensesPieChart(expenses);
}

async function createBalanceChart(expenses) {
    const canvas = document.getElementById('balance-chart');
    const titleElement = document.getElementById('balance-chart-title');
    
    // Détruire l'ancien graphique s'il existe
    if (window.balanceChart) {
        window.balanceChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    
    // Mettre à jour le titre selon la période
    switch (selectedPeriod) {
        case 'week':
            titleElement.textContent = 'État de Santé du Compte - Cette Semaine';
            break;
        case 'month':
            titleElement.textContent = 'État de Santé du Compte - Ce Mois';
            break;
        case 'year':
        default:
            titleElement.textContent = 'État de Santé du Compte - Cette Année';
            break;
    }
    
    // Préparer les données selon la période
    const data = await prepareBalanceData(expenses);
    
    // Créer le nouveau graphique et le stocker globalement
    window.balanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Solde du Compte',
                data: data.balances,
                borderColor: '#76b900',
                backgroundColor: 'rgba(118, 185, 0, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#9ca3af'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#9ca3af'
                    }
                }
            }
        }
    });
}

function createExpensesPieChart(expenses) {
    const canvas = document.getElementById('expenses-pie-chart');
    const titleElement = document.getElementById('pie-chart-title');
    
    // Détruire l'ancien graphique s'il existe
    if (window.pieChart) {
        window.pieChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    
    // Mettre à jour le titre selon la période
    switch (selectedPeriod) {
        case 'week':
            titleElement.textContent = 'Répartition des Dépenses - Cette Semaine';
            break;
        case 'month':
            titleElement.textContent = 'Répartition des Dépenses - Ce Mois';
            break;
        case 'year':
        default:
            titleElement.textContent = 'Répartition des Dépenses - Cette Année';
            break;
    }
    
    // Préparer les données pour le camembert
    const data = prepareExpensesPieData(expenses);
    
    // Créer le nouveau graphique et le stocker globalement
    window.pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: [
                    '#76b900', // Vert
                    '#f59e0b', // Orange
                    '#ef4444', // Rouge
                    '#3b82f6', // Bleu
                    '#8b5cf6', // Violet
                    '#ec4899', // Rose
                    '#06b6d4', // Cyan
                    '#84cc16', // Lime
                    '#f97316', // Orange foncé
                    '#6366f1'  // Indigo
                ],
                borderWidth: 2,
                borderColor: '#374151'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

async function prepareBalanceData(expenses) {
    const labels = [];
    const balances = [];
    const now = new Date();
    
    // Récupérer la configuration utilisateur
    let userConfig = config;
    if (window.authService) {
        userConfig = await window.authService.getUserConfig();
    }
    
    // Solde initial depuis la config
    let initialBalance = userConfig.initialBalance || 0;
    
    switch (selectedPeriod) {
        case 'week':
            // Générer 7 points pour la semaine (lundi au dimanche)
            const { startDate: weekStart } = getPeriodDates('week');
            for (let i = 0; i < 7; i++) {
                const day = new Date(weekStart);
                day.setDate(weekStart.getDate() + i);
                
                // Format du label : "Lun", "Mar", etc.
                const dayName = day.toLocaleString('fr-FR', { weekday: 'short' });
                labels.push(dayName);
                
                // Calculer le solde à la fin de ce jour
                const dayEnd = new Date(day);
                dayEnd.setHours(23, 59, 59, 999);
                
                const transactionsUntilDay = expenses.filter(exp => {
                    const expDate = new Date(exp.date);
                    return expDate <= dayEnd;
                });
                
                const dayBalance = initialBalance + transactionsUntilDay.reduce((sum, exp) => sum + exp.amount, 0);
                balances.push(dayBalance);
            }
            break;
            
        case 'month':
            // Générer ~30 points pour le mois (un par jour)
            const { startDate: monthStart, endDate: monthEnd } = getPeriodDates('month');
            const daysInMonth = Math.ceil((monthEnd - monthStart) / (1000 * 60 * 60 * 24));
            
            for (let i = 0; i < daysInMonth; i++) {
                const day = new Date(monthStart);
                day.setDate(monthStart.getDate() + i);
                
                // Format du label : "1", "2", "3", etc.
                labels.push(day.getDate().toString());
                
                // Calculer le solde à la fin de ce jour
                const dayEnd = new Date(day);
                dayEnd.setHours(23, 59, 59, 999);
                
                const transactionsUntilDay = expenses.filter(exp => {
                    const expDate = new Date(exp.date);
                    return expDate <= dayEnd;
                });
                
                const dayBalance = initialBalance + transactionsUntilDay.reduce((sum, exp) => sum + exp.amount, 0);
                balances.push(dayBalance);
            }
            break;
            
        case 'year':
        default:
            // Générer 12 points pour l'année (un par mois)
            for (let i = 0; i < 12; i++) {
                const month = new Date(now.getFullYear(), i, 1);
                const monthName = month.toLocaleString('fr-FR', { month: 'short' });
                labels.push(monthName);
                
                // Calculer le solde à la fin de ce mois
                const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
                const transactionsUntilMonth = expenses.filter(exp => {
                    const expDate = new Date(exp.date);
                    return expDate <= monthEnd;
                });
                
                const monthBalance = initialBalance + transactionsUntilMonth.reduce((sum, exp) => sum + exp.amount, 0);
                balances.push(monthBalance);
            }
            break;
    }
    
    return { labels: labels, balances: balances };
}

function prepareExpensesPieData(expenses) {
    const { startDate, endDate } = getPeriodDates(selectedPeriod);
    
    // Filtrer seulement les dépenses de la période sélectionnée
    const expenseOnly = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return (exp.type === 'expense' || exp.amount < 0) && 
               expDate >= startDate && 
               expDate <= endDate;
    });
    
    // Grouper par catégorie
    const categoryTotals = {};
    expenseOnly.forEach(exp => {
        // Extraire le nom principal de la catégorie (avant les parenthèses)
        let category = exp.category || 'Autres';
        if (category.includes('(')) {
            category = category.split('(')[0].trim();
        }
        
        categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(exp.amount);
    });
    
    // Trier par montant décroissant et prendre les 8 plus importantes
    const sortedCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8);
    
    const labels = sortedCategories.map(([category]) => category);
    const values = sortedCategories.map(([, amount]) => amount);
    
    return { labels: labels, values: values };
}

// Exposer la fonction pour qu'elle soit accessible depuis d'autres scripts
window.refreshDashboard = refreshDashboard;

// Fonction pour afficher la popup de confirmation de suppression de compte
function showDeleteAccountConfirmation() {
    console.log('🔍 showDeleteAccountConfirmation appelée (dashboard)');
    
    // Vérifier que l'utilisateur est connecté
    if (!window.authService || !window.authService.isUserAuthenticated()) {
        console.error('❌ Utilisateur non connecté');
        alert('Tu dois être connecté pour supprimer ton compte');
        return;
    }
    
    // Créer la popup si elle n'existe pas
    let deletePopup = document.getElementById('delete-account-popup');
    if (!deletePopup) {
        console.log('📝 Création de la popup de suppression (dashboard)');
        deletePopup = document.createElement('div');
        deletePopup.id = 'delete-account-popup';
        deletePopup.className = 'popup-overlay';
        deletePopup.innerHTML = `
            <div class="popup-content delete-account-popup">
                <div class="popup-header">
                    <h3>🗑️ Supprimer mon compte</h3>
                </div>
                <div class="popup-body">
                    <p>Es-tu sûr de vouloir abandonner la gestion de ton budget ?</p>
                    <p class="warning-text">⚠️ Cette action est irréversible ! Toutes tes données seront définitivement supprimées.</p>
                </div>
                <div class="popup-buttons">
                    <button class="popup-btn popup-btn-danger" id="confirm-delete-account">
                        <span class="icon">💀</span>
                        Oui, supprimer mon compte
                    </button>
                    <button class="popup-btn popup-btn-cancel" id="cancel-delete-account">
                        <span class="icon">😅</span>
                        Non, je garde mon compte
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(deletePopup);
        
        // Ajouter les événements
        const confirmBtn = deletePopup.querySelector('#confirm-delete-account');
        const cancelBtn = deletePopup.querySelector('#cancel-delete-account');
        
        confirmBtn.addEventListener('click', async () => {
            console.log('💀 Bouton de suppression cliqué (dashboard)');
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<span class="icon">⏳</span> Suppression en cours...';
            
            try {
                console.log('📡 Appel de deleteAccount... (dashboard)');
                const result = await window.authService.deleteAccount();
                console.log('📡 Résultat:', result);
                
                if (result.success) {
                    deletePopup.classList.remove('active');
                    showAuthMessage('💀 Compte supprimé avec succès. Adieu, dépensier !', 'success');
                    updateAuthButton();
                    loadDashboardData();
                } else {
                    showAuthMessage(result.message || 'Erreur lors de la suppression', 'error');
                    confirmBtn.disabled = false;
                    confirmBtn.innerHTML = '<span class="icon">💀</span> Oui, supprimer mon compte';
                }
            } catch (error) {
                console.error('❌ Erreur lors de la suppression:', error);
                showAuthMessage('Erreur lors de la suppression du compte', 'error');
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<span class="icon">💀</span> Oui, supprimer mon compte';
            }
        });
        
        cancelBtn.addEventListener('click', () => {
            console.log('😅 Annulation de la suppression (dashboard)');
            deletePopup.classList.remove('active');
        });
        
        // Fermer en cliquant à l'extérieur
        deletePopup.addEventListener('click', (e) => {
            if (e.target === deletePopup) {
                deletePopup.classList.remove('active');
            }
        });
    }
    
    // Afficher la popup
    console.log('🎭 Affichage de la popup (dashboard)');
    deletePopup.classList.add('active');
}

    // Fonction pour ouvrir le coffre et obtenir des points
    async function openChest(chestPopup) {
        console.log('🎲 Ouverture du coffre quotidien...');
        
        // Désactiver le clic pendant l'animation
        const clickableChest = chestPopup.querySelector('#clickable-chest');
        clickableChest.style.pointerEvents = 'none';
        
        // Animation d'ouverture du coffre
        clickableChest.style.animation = 'chestOpen 0.5s ease-in-out';
        
        // Tirage au sort des points
        const points = getRandomPoints();
        
        // Attendre la fin de l'animation
        setTimeout(async () => {
            // Créer les confettis
            createChestConfetti(chestPopup);
            
            // Afficher le résultat
            showChestResult(chestPopup, points);
            
            // Sauvegarder les points dans la base de données
            await saveChestPoints(points);
            
            // Recharger le score si on est sur la page RPGhetto
            if (window.RPGhetto && window.RPGhetto.calculateTotalScore) {
                try {
                    await window.RPGhetto.calculateTotalScore();
                    console.log('📊 Score rechargé après gain du coffre');
                    
                    // Mettre à jour l'affichage du profil utilisateur
                    if (window.updateUserProfile) {
                        await window.updateUserProfile();
                        console.log('👤 Profil utilisateur mis à jour');
                    }
                } catch (error) {
                    console.error('❌ Erreur lors du rechargement du score:', error);
                }
            }
            
            // Réactiver le clic après un délai
            setTimeout(() => {
                clickableChest.style.pointerEvents = 'auto';
                clickableChest.style.animation = 'chestMove 2s ease-in-out infinite';
            }, 3000);
        }, 500);
    }
    
    // Fonction pour obtenir des points aléatoires
    function getRandomPoints() {
        const random = Math.random();
        
        if (random < 0.5) {
            return 5; // 50% de chance
        } else if (random < 0.8) {
            return 10; // 30% de chance
        } else {
            return 15; // 20% de chance
        }
    }
    
    // Fonction pour créer les confettis
    function createChestConfetti(chestPopup) {
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'chest-confetti-container';
        confettiContainer.style.position = 'absolute';
        confettiContainer.style.top = '0';
        confettiContainer.style.left = '0';
        confettiContainer.style.width = '100%';
        confettiContainer.style.height = '100%';
        confettiContainer.style.pointerEvents = 'none';
        confettiContainer.style.zIndex = '1000';
        confettiContainer.style.overflow = 'hidden';
        
        // Créer 30 confettis colorés
        for (let i = 0; i < 30; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'chest-confetti';
            confetti.style.position = 'absolute';
            confetti.style.top = '50%';
            confetti.style.left = '50%';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.background = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'][Math.floor(Math.random() * 7)];
            confetti.style.borderRadius = '50%';
            confetti.style.transform = 'translate(-50%, -50%)';
            confetti.style.animation = `chestConfettiExplosion ${Math.random() * 1 + 1}s ease-out forwards`;
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            confettiContainer.appendChild(confetti);
        }
        
        chestPopup.appendChild(confettiContainer);
        
        // Supprimer les confettis après l'animation
        setTimeout(() => {
            if (confettiContainer.parentNode) {
                confettiContainer.parentNode.removeChild(confettiContainer);
            }
        }, 3000);
    }
    
    // Fonction pour afficher le résultat
    function showChestResult(chestPopup, points) {
        const chestContent = chestPopup.querySelector('.chest-content');
        const originalContent = chestContent.innerHTML;
        
        // Remplacer le contenu par le résultat
        chestContent.innerHTML = `
            <div class="chest-result">
                <div class="chest-result-icon">🎉</div>
                <h3 class="chest-result-title">Félicitations !</h3>
                <div class="chest-result-points">+${points} points</div>
                <p class="chest-result-message">Tes points ont été ajoutés à ton score !</p>
            </div>
        `;
        
        // Restaurer le contenu original après 3 secondes
        setTimeout(() => {
            chestContent.innerHTML = originalContent;
            
            // Réattacher l'événement de clic
            const clickableChest = chestPopup.querySelector('#clickable-chest');
            if (clickableChest) {
                clickableChest.addEventListener('click', () => {
                    openChest(chestPopup);
                });
            }
        }, 3000);
    }
    
    // Fonction pour sauvegarder les points et la date d'ouverture dans la base de données
    async function saveChestPoints(points) {
        try {
            if (window.authService && window.authService.isUserAuthenticated()) {
                const user = window.authService.getCurrentUser();
                const currentPoints = await window.authService.getData('chest_points') || 0;
                const newTotal = currentPoints + points;
                
                // Sauvegarder les points
                await window.authService.saveData('chest_points', newTotal);
                
                // Sauvegarder la date d'ouverture (timestamp)
                const openTime = new Date().toISOString();
                await window.authService.saveData('last_chest_open', openTime);
                
                console.log(`📦 Points du coffre sauvegardés: ${currentPoints} + ${points} = ${newTotal}`);
                console.log(`📅 Date d'ouverture sauvegardée: ${openTime}`);
            }
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde des points du coffre:', error);
        }
    }
    
    // Fonction pour vérifier si le coffre peut être ouvert (délai de 24h)
    async function canOpenChest() {
        try {
            if (!window.authService || !window.authService.isUserAuthenticated()) {
                return { canOpen: false, timeRemaining: null, reason: 'Non connecté' };
            }
            
            const lastOpenTime = await window.authService.getData('last_chest_open');
            
            if (!lastOpenTime) {
                return { canOpen: true, timeRemaining: null, reason: 'Première ouverture' };
            }
            
            const lastOpen = new Date(lastOpenTime);
            const now = new Date();
            const timeDiff = now - lastOpen;
            const hoursDiff = timeDiff / (1000 * 60 * 60); // Différence en heures
            
            if (hoursDiff >= 24) {
                return { canOpen: true, timeRemaining: null, reason: 'Délai écoulé' };
            } else {
                const remainingHours = 24 - hoursDiff;
                const remainingMinutes = Math.ceil((remainingHours % 1) * 60);
                const remainingHoursInt = Math.floor(remainingHours);
                
                return { 
                    canOpen: false, 
                    timeRemaining: { hours: remainingHoursInt, minutes: remainingMinutes },
                    reason: 'Délai non écoulé'
                };
            }
        } catch (error) {
            console.error('❌ Erreur lors de la vérification du délai du coffre:', error);
            return { canOpen: false, timeRemaining: null, reason: 'Erreur de vérification' };
        }
    }
    
    // Fonction pour formater le temps restant
    function formatTimeRemaining(timeRemaining) {
        if (!timeRemaining) return '';
        
        if (timeRemaining.hours > 0) {
            return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
        } else {
            return `${timeRemaining.minutes}m`;
        }
    }
    
    // Fonction pour démarrer le compteur en temps réel
    function startCountdownTimer(chestPopup, timeRemaining) {
        if (!timeRemaining) return;
        
        const countdownElement = chestPopup.querySelector('#countdown-timer .time-remaining');
        if (!countdownElement) return;
        
        // Calculer le temps total en millisecondes
        const totalMinutes = timeRemaining.hours * 60 + timeRemaining.minutes;
        let remainingMs = totalMinutes * 60 * 1000;
        
        const updateTimer = () => {
            if (remainingMs <= 0) {
                countdownElement.textContent = 'Prêt !';
                // Recharger la popup pour permettre l'ouverture
                setTimeout(() => {
                    chestPopup.classList.remove('active');
                    setTimeout(() => openDailyChest(), 500);
                }, 1000);
                return;
            }
            
            const hours = Math.floor(remainingMs / (1000 * 60 * 60));
            const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
            
            if (hours > 0) {
                countdownElement.textContent = `${hours}h ${minutes}m`;
            } else {
                countdownElement.textContent = `${minutes}m`;
            }
            
            remainingMs -= 1000; // Décrémenter d'une seconde
        };
        
        // Mettre à jour immédiatement puis toutes les secondes
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        
        // Nettoyer l'intervalle quand la popup est fermée
        const closeBtn = chestPopup.querySelector('#close-daily-chest-popup');
        const cleanup = () => {
            clearInterval(interval);
            chestPopup.removeEventListener('click', cleanup);
            if (closeBtn) closeBtn.removeEventListener('click', cleanup);
        };
        
        chestPopup.addEventListener('click', cleanup);
        if (closeBtn) closeBtn.addEventListener('click', cleanup);
    }

    // Exposer les fonctions globalement
    window.showDeleteAccountConfirmation = showDeleteAccountConfirmation;
    window.openDailyChest = openDailyChest; 