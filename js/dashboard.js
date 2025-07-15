// Dashboard JavaScript pour FCKNGMoney
document.addEventListener('DOMContentLoaded', async function() {
    // Charger la configuration utilisateur
    if (window.authService) {
        config = await window.authService.getUserConfig();
    }
    
    // Initialiser l'authentification
    initAuth();
    
    await loadDashboardData();
    initQuotesCarousel();
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

async function loadDashboardData() {
    // Récupérer les données depuis le localStorage
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    
    // Calculer les données du tableau de bord
    const dashboardData = await calculateDashboardData(expenses);
    
    // Mettre à jour l'affichage
    await updateDashboardDisplay(dashboardData);
    
    // Calculer et afficher les stats de criminels financiers
    updateCriminalStats(expenses);
    
    // Créer les graphiques
    await createCharts(expenses);
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
    
    // Configurer la validation du mot de passe
    setupPasswordValidation();
    
    // Ouvrir la popup d'authentification
    authBtn.addEventListener('click', () => {
        if (window.authService.isUserAuthenticated()) {
            // Si connecté, proposer la déconnexion
            if (confirm('Voulez-vous vous déconnecter ?')) {
                window.authService.logout();
                updateAuthButton();
                // Recharger les données du dashboard
                loadDashboardData();
            }
        } else {
            // Si non connecté, ouvrir la popup
            authPopup.classList.add('active');
        }
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
                loadDashboardData();
                
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
        authBtn.textContent = `Déconnexion (${user.uniqueId})`;
        authBtn.className = 'auth-btn connected';
    } else {
        authBtn.textContent = 'Se Connecter';
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
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Récupérer la configuration utilisateur
    let userConfig = config;
    if (window.authService) {
        userConfig = await window.authService.getUserConfig();
    }
    
    // Utiliser le solde initial de la config + les transactions
    let totalBalance = userConfig.initialBalance || 0;
    let monthlyCracks = 0;
    let unnecessarySpending = 0;
    
    expenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        const amount = parseFloat(expense.amount);
        
        // Calculer le solde total
        if (expense.type === 'income') {
            totalBalance += amount;
        } else {
            totalBalance += amount; // Les dépenses sont déjà négatives dans le stockage
        }
        
        // Compter les craquages du mois en cours (dépenses "pose pas de question")
        if (expenseDate.getMonth() === currentMonth && 
            expenseDate.getFullYear() === currentYear &&
            expense.type === 'expense' &&
            expense.necessity === 'Pose pas de questions qui fâchent') {
            monthlyCracks++;
        }
        
        // Calculer les dépenses inutiles
        if (expense.necessity === 'Pose pas de questions qui fâchent' && 
            expense.type === 'expense') {
            unnecessarySpending += Math.abs(amount); // Utiliser la valeur absolue pour l'affichage
        }
    });
    
    return {
        balance: totalBalance,
        monthlyCracks: monthlyCracks,
        unnecessarySpending: unnecessarySpending
    };
}

async function updateDashboardDisplay(data) {
    // Mettre à jour l'état du compte
    await updateAccountStatus(data.balance);
    
    // Mettre à jour le nombre de craquages
    updateMonthlyCracks(data.monthlyCracks);
    
    // Mettre à jour les dépenses inutiles
    updateUnnecessarySpending(data.unnecessarySpending);
}

async function updateAccountStatus(balance) {
    const balanceElement = document.getElementById('current-balance');
    const messageElement = document.getElementById('balance-message');
    const cardElement = document.getElementById('account-status-card');
    
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

function updateMonthlyCracks(cracksCount) {
    const cracksElement = document.getElementById('monthly-cracks');
    const messageElement = document.getElementById('cracks-message');
    const cardElement = document.getElementById('monthly-cracks-card');
    
    cracksElement.textContent = cracksCount;
    
    // Déterminer le message selon le nombre de craquages
    let message = '';
    let statusClass = '';
    
    if (cracksCount === 0) {
        message = "Bravo ! Tu as tenu bon ce mois-ci !";
        statusClass = 'low';
    } else if (cracksCount <= 3) {
        message = "Pas mal, tu te tiens encore !";
        statusClass = 'low';
    } else if (cracksCount <= 7) {
        message = "Bon, ça commence à faire beaucoup là...";
        statusClass = 'medium';
    } else if (cracksCount <= 15) {
        message = "Tu as un problème avec l'argent ou quoi ?";
        statusClass = 'high';
    } else {
        message = "Tu es complètement dingue ou quoi ?!";
        statusClass = 'high';
    }
    
    messageElement.textContent = message;
    
    // Appliquer la classe CSS pour les couleurs
    cardElement.className = `dashboard-card ${statusClass}`;
}

function updateUnnecessarySpending(total) {
    const amountElement = document.getElementById('unnecessary-total');
    const messageElement = document.getElementById('unnecessary-message');
    
    amountElement.textContent = `${total.toFixed(2)}€`;
    
    // Le message reste toujours le même comme demandé
    messageElement.textContent = "Tu vois si t'arrêtais tes conneries...";
}

// Fonction pour rafraîchir les données (peut être appelée depuis d'autres pages)
function refreshDashboard() {
    loadDashboardData();
}

function updateCriminalStats(expenses) {
    // Calculer les jours sans craquage
    const daysWithoutCrack = calculateDaysWithoutCrack(expenses);
    
    // Calculer la plus grosse dépense du mois
    const biggestExpense = calculateBiggestExpenseThisMonth(expenses);
    
    // Calculer l'amélioration vs mois dernier
    const improvement = calculateImprovementVsLastMonth(expenses);
    
    // Mettre à jour l'affichage
    document.getElementById('days-without-crack').textContent = daysWithoutCrack;
    document.getElementById('biggest-expense').textContent = `${biggestExpense.toFixed(2)}€`;
    document.getElementById('improvement').textContent = `${improvement.toFixed(1)}%`;
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

function calculateBiggestExpenseThisMonth(expenses) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filtrer les dépenses du mois en cours
    const thisMonthExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === currentMonth && 
               expDate.getFullYear() === currentYear && 
               exp.type === 'expense'; // Seulement les dépenses
    });
    
    if (thisMonthExpenses.length === 0) {
        return 0;
    }
    
    // Trouver la plus grosse dépense (valeur absolue la plus élevée)
    const biggest = thisMonthExpenses.reduce((max, exp) => {
        return Math.abs(exp.amount) > Math.abs(max.amount) ? exp : max;
    });
    
    return Math.abs(biggest.amount);
}

function calculateImprovementVsLastMonth(expenses) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calculer le total du mois en cours
    const thisMonthTotal = expenses
        .filter(exp => {
            const expDate = new Date(exp.date);
            return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
        })
        .reduce((sum, exp) => sum + exp.amount, 0);
    
    // Calculer le total du mois dernier
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const lastMonthTotal = expenses
        .filter(exp => {
            const expDate = new Date(exp.date);
            return expDate.getMonth() === lastMonth && expDate.getFullYear() === lastMonthYear;
        })
        .reduce((sum, exp) => sum + exp.amount, 0);
    
    // Calculer le pourcentage d'amélioration
    if (lastMonthTotal === 0) {
        // Si pas de données le mois dernier, on ne peut pas calculer de pourcentage
        return thisMonthTotal > 0 ? 100 : 0;
    }
    
    const percentageChange = ((thisMonthTotal - lastMonthTotal) / Math.abs(lastMonthTotal)) * 100;
    return percentageChange;
}

async function createCharts(expenses) {
    await createBalanceChart(expenses);
    createExpensesPieChart(expenses);
}

async function createBalanceChart(expenses) {
    const ctx = document.getElementById('balance-chart').getContext('2d');
    
    // Préparer les données pour les 6 derniers mois
    const data = await prepareBalanceData(expenses);
    
    new Chart(ctx, {
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
    const ctx = document.getElementById('expenses-pie-chart').getContext('2d');
    
    // Préparer les données pour le camembert
    const data = prepareExpensesPieData(expenses);
    
    new Chart(ctx, {
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
    const months = [];
    const balances = [];
    const now = new Date();
    
    // Récupérer la configuration utilisateur
    let userConfig = config;
    if (window.authService) {
        userConfig = await window.authService.getUserConfig();
    }
    
    // Solde initial depuis la config
    let initialBalance = userConfig.initialBalance || 0;
    
    // Générer les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = month.toLocaleString('fr-FR', { month: 'short' });
        months.push(monthName);
        
        // Calculer le solde à la fin de ce mois
        // Filtrer toutes les transactions jusqu'à la fin de ce mois
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
        const transactionsUntilMonth = expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate <= monthEnd;
        });
        
        // Calculer le solde : solde initial + toutes les transactions jusqu'à ce mois
        const monthBalance = initialBalance + transactionsUntilMonth.reduce((sum, exp) => sum + exp.amount, 0);
        balances.push(monthBalance);
    }
    
    return { labels: months, balances: balances };
}

function prepareExpensesPieData(expenses) {
    // Filtrer seulement les dépenses (pas les revenus)
    // Prendre toutes les transactions avec un montant négatif OU type 'expense'
    const expenseOnly = expenses.filter(exp => {
        return exp.type === 'expense' || exp.amount < 0;
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