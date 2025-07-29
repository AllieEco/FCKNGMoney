document.addEventListener('DOMContentLoaded', () => {
    // Initialiser l'authentification
    initAuth();

    // Système de couleurs pour les catégories
    const categoryColors = {
        'Alimentation (Graisse & Sucre)': '#ff6b6b',      // Rouge corail
        'Transports (Gas-oil & Galères)': '#4ecdc4',      // Turquoise
        'Loisirs (Procrastination Payante)': '#45b7d1',   // Bleu ciel
        'Shopping': '#96ceb4',                            // Vert menthe
        'Santé': '#feca57',                               // Jaune
        'Maison (Le Foyer du Gouffre)': '#ff9ff3',        // Rose
        'Banque (Ton banquier te remercie)': '#54a0ff',   // Bleu
        'Restaurant (Se faire plumer au resto)': '#ff6348', // Rouge-orange
        'Voyages': '#5f27cd',                             // Violet
        'Éducation': '#00d2d3',                           // Cyan
        'Sport': '#10ac84',                               // Vert émeraude
        'Technologie': '#ff9f43',                         // Orange
        'Beauté': '#f368e0',                              // Rose vif
        'Cadeaux': '#ff3838',                             // Rouge vif
        'Cigarettes (Clopes & Toux Grasse)': '#8b4513',   // Marron
        'Alcool (Alcool & Mauvaises Décisions)': '#ff4500', // Rouge-orange foncé
        'Epargne (Retarder l\'inévitable)': '#32cd32',    // Vert lime
        'Revenu (Salaire (Bientôt Disparu))': '#00ff00',  // Vert vif
        'Autres (WTF (Autres purges))': '#8395a7',        // Gris
        'Vêtement (Pour mieux pleurer devant le miroir)': '#b983ff', // Violet pastel
        'Cadeau (Pour acheter l\'amour des autres)': '#ffb347', // Orange cadeau
        'Ecole (L\'école de la dette)': '#00b894', // Vert école
        'Medecin (La santé a un prix...)': '#e17055', // Rouge santé
        'Animaux (Pour ton futur héritier à poils)': '#ffe066' // Jaune animal
    };

    // DOM Elements
    const expenseForm = document.getElementById('expense-form');
    const historyBody = document.getElementById('history-body');
    const submitBtn = expenseForm.querySelector('button[type="submit"]');

    // Form Inputs
    const expenseIdInput = document.getElementById('expense-id');
    const culpritInput = document.getElementById('culprit');
    const crimeDateInput = document.getElementById('crime-date');
    const categoryInput = document.getElementById('category');
    const paymentMethodInput = document.getElementById('payment-method');
    const transactionTypeInput = document.getElementById('transaction-type');
    const necessityInput = document.getElementById('necessity');
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');

    // Filter Elements
    const filterYearEl = document.getElementById('filter-year');
    const filterMonthEl = document.getElementById('filter-month');
    const filterCategoryEl = document.getElementById('filter-category');
    const filterCulpritEl = document.getElementById('filter-culprit');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const exportPdfBtn = document.getElementById('export-pdf-btn');

    // Stats Elements
    const totalDamageEl = document.getElementById('total-damage');
    const monthDamageEl = document.getElementById('month-damage');
    const totalCracksEl = document.getElementById('total-cracks');
    const avgPainEl = document.getElementById('avg-pain');
    const currentMonthEl = document.getElementById('current-month');

    // Data Store
    let expenses = [];

    // Fonction pour obtenir la clé de stockage spécifique à l'utilisateur
    function getExpensesStorageKey() {
        if (window.authService && window.authService.isUserAuthenticated()) {
            const user = window.authService.getCurrentUser();
            return `expenses_${user.email}`;
        }
        return 'expenses'; // Pour les utilisateurs non connectés
    }

    // Fonction pour charger les dépenses depuis le bon stockage
    function loadExpenses() {
        const storageKey = getExpensesStorageKey();
        expenses = JSON.parse(localStorage.getItem(storageKey)) || [];
    }

    // Fonction pour sauvegarder les dépenses dans le bon stockage
    function saveExpensesToStorage() {
        const storageKey = getExpensesStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(expenses));
    }

    // Fonction pour gérer la déconnexion
    function handleLogout() {
        // Déconnecter l'utilisateur (les données sont conservées)
        window.authService.logout();
        
        // Recharger les données pour l'utilisateur local
        loadExpenses();
        render();
        
        // Mettre à jour l'interface
        updateAuthButton();
        
        // Rafraîchir le tableau de bord si il existe
        if (typeof window.refreshDashboard === 'function') {
            window.refreshDashboard();
        }
    }

    // --- Main Submit Handler (Add & Edit) ---
    expenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const transactionType = transactionTypeInput.value;
        let amount = parseFloat(amountInput.value);

        // Make amount negative for expenses
        if (transactionType === 'expense') {
            amount = -Math.abs(amount);
        } else {
            amount = Math.abs(amount);
        }

        const expenseData = {
            culprit: culpritInput.value,
            date: crimeDateInput.value,
            category: categoryInput.value,
            paymentMethod: paymentMethodInput.value,
            necessity: necessityInput.value,
            amount: amount, // Signed amount
            description: descriptionInput.value,
            type: transactionType
        };
        
        // Basic Validation
        if (!expenseData.culprit || !expenseData.date || !expenseData.category || isNaN(expenseData.amount)) {
            alert('Les champs "Coupable", "Date", "Catégorie" et "La Douille" sont obligatoires.');
            return;
        }

        const id = expenseIdInput.value;
        if (id) {
            // Update
            const index = expenses.findIndex(exp => exp.id === parseInt(id));
            if (index > -1) {
                expenses[index] = { id: parseInt(id), ...expenseData };
            }
        } else {
            // Add New
            const newExpense = { id: Date.now(), ...expenseData };
            expenses.push(newExpense);
        }
        
        expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        saveExpensesToStorage();
        // Synchroniser avec le serveur si connecté
        if (window.authService && window.authService.isUserAuthenticated()) {
            try {
                await window.authService.saveData('expenses', expenses);
                console.log('✅ Dépenses synchronisées avec le serveur');
            } catch (error) {
                console.error('Erreur lors de la synchronisation des dépenses:', error);
            }
        }
        render();
        resetForm();
    });

    // --- Event Delegation for Edit & Delete in Table ---
    historyBody.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        const row = e.target.closest('tr');
        if (!row) return;

        const id = parseInt(row.dataset.id);
        const expense = expenses.find(exp => exp.id === id);

        if (editBtn && expense) {
            expenseIdInput.value = expense.id;
            culpritInput.value = expense.culprit;
            crimeDateInput.value = expense.date;
            categoryInput.value = expense.category;
            paymentMethodInput.value = expense.paymentMethod;
            necessityInput.value = expense.necessity;
            transactionTypeInput.value = expense.type || 'expense'; // Default to expense for old data
            amountInput.value = Math.abs(expense.amount); // Form always shows positive
            descriptionInput.value = expense.description;
            
            submitBtn.textContent = 'Modifier ce Crime';
            window.scrollTo({ top: 0, behavior: 'smooth' });
            culpritInput.focus();
        }

        if (deleteBtn && expense) {
            if (confirm(`Sûr de vouloir effacer cette dépense de ${expense.amount}€ chez ${expense.culprit} ? C'est pas en l'effaçant que l'argent va revenir...`)) {
                expenses = expenses.filter(exp => exp.id !== id);
                saveExpensesToStorage();
                // Synchroniser avec le serveur si connecté
                if (window.authService && window.authService.isUserAuthenticated()) {
                    try {
                        await window.authService.saveData('expenses', expenses);
                        console.log('✅ Dépenses synchronisées avec le serveur');
                    } catch (error) {
                        console.error('Erreur lors de la synchronisation des dépenses:', error);
                    }
                }
                render();
            }
        }
    });

    // --- Filter Logic ---
    [filterYearEl, filterMonthEl, filterCategoryEl, filterCulpritEl].forEach(el => {
        el.addEventListener('change', () => render());
    });
    filterCulpritEl.addEventListener('keyup', () => render());

    resetFiltersBtn.addEventListener('click', () => {
        filterYearEl.value = 'all';
        filterMonthEl.value = 'all';
        filterCategoryEl.value = 'all';
        filterCulpritEl.value = '';
        render();
    });

    // Export PDF avec filtres
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', () => exportExpensesToPDF());
    }

    // --- Core Functions ---
    async function saveExpensesToLocalStorage() {
        saveExpensesToStorage();
        
        // Synchroniser avec le serveur si connecté
        if (window.authService && window.authService.isUserAuthenticated()) {
            try {
                await window.authService.saveData('expenses', expenses);
                console.log('✅ Dépenses synchronisées avec le serveur');
            } catch (error) {
                console.error('Erreur lors de la synchronisation des dépenses:', error);
                // En cas d'erreur, on garde les données locales
            }
        }
        
        // Rafraîchir le tableau de bord si il existe
        if (typeof window.refreshDashboard === 'function') {
            window.refreshDashboard();
        }
    }

    function resetForm() {
        expenseForm.reset();
        expenseIdInput.value = '';
        crimeDateInput.value = new Date().toISOString().split('T')[0];
        submitBtn.textContent = "J'assume (c'est la faute à Macron)";
    }
    
    function render() {
        const filteredExpenses = getFilteredExpenses();
        renderTable(filteredExpenses);
        calculateStats(filteredExpenses); // Use filtered expenses for stats too
    }

    function getFilteredExpenses() {
        const year = filterYearEl.value;
        const month = filterMonthEl.value;
        const category = filterCategoryEl.value;
        const culprit = filterCulpritEl.value.toLowerCase();

        return expenses.filter(exp => {
            const expDate = new Date(exp.date);
            if (year !== 'all' && expDate.getFullYear() != year) return false;
            if (month !== 'all' && expDate.getMonth() != month) return false;
            if (category !== 'all' && exp.category !== category) return false;
            if (culprit && !exp.culprit.toLowerCase().includes(culprit)) return false;
            return true;
        });
    }

    function renderTable(expensesToRender) {
        historyBody.innerHTML = '';
        if (expensesToRender.length === 0) {
            historyBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem;">Aucun crime ne correspond à tes filtres. T'as de la chance.</td></tr>`;
            return;
        }

        expensesToRender.forEach(expense => {
            const row = document.createElement('tr');
            row.dataset.id = expense.id;

            // Appliquer la couleur de la catégorie
            if (expense.category && categoryColors[expense.category]) {
                const categoryColor = categoryColors[expense.category];
                row.style.borderLeft = `4px solid ${categoryColor}`;
                row.style.backgroundColor = `${categoryColor}15`; // Version très transparente de la couleur
            }

            const amountClass = expense.amount >= 0 ? 'amount-positive' : 'amount-negative';
            const formattedAmount = `${expense.amount.toFixed(2)}€`;

            row.innerHTML = `
                <td>${new Date(expense.date).toLocaleDateString()}</td>
                <td>${expense.culprit}</td>
                <td>${expense.category}</td>
                <td>${expense.necessity}</td>
                <td><span class="${amountClass}">${formattedAmount}</span></td>
                <td>${expense.paymentMethod}</td>
                <td class="actions-cell">
                    <button class="edit-btn" title="Modifier">✏️</button>
                    <button class="delete-btn" title="Supprimer">🗑️</button>
                </td>
            `;
            historyBody.appendChild(row);
        });
    }

    function calculateStats(statsExpenses) {
        const totalDamage = statsExpenses.reduce((acc, exp) => acc + exp.amount, 0);
        
        const expenseOnly = statsExpenses.filter(exp => exp.type === 'expense');
        const totalCracks = expenseOnly.length;
        const totalPain = expenseOnly.reduce((acc, exp) => acc + exp.amount, 0);
        
        const now = new Date();
        const currentMonthName = now.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
        
        // This stat always shows current month's damage regardless of filters
        const monthDamage = expenses
            .filter(exp => {
                const expDate = new Date(exp.date);
                return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
            })
            .reduce((acc, exp) => acc + exp.amount, 0);

        totalDamageEl.textContent = `${totalDamage.toFixed(2)}€`;
        totalDamageEl.nextElementSibling.textContent = filterYearEl.value !== 'all' || filterMonthEl.value !== 'all' || filterCategoryEl.value !== 'all' || filterCulpritEl.value ? 'Solde des filtres' : 'Solde Actuel';
        monthDamageEl.textContent = `${monthDamage.toFixed(2)}€`;
        totalCracksEl.textContent = totalCracks;
        avgPainEl.textContent = totalCracks > 0 ? `${(totalPain / totalCracks).toFixed(2)}€` : '0.00€';
        currentMonthEl.textContent = currentMonthName;

        // Appliquer les classes CSS dynamiques pour les couleurs
        updateStatCardColors(totalDamage, monthDamage, totalCracks, totalPain / totalCracks);
    }

    function populateFilterOptions() {
        // Populate years
        const years = [...new Set(expenses.map(exp => new Date(exp.date).getFullYear()))];
        filterYearEl.innerHTML = '<option value="all">Toutes les années</option>';
        years.sort((a,b) => b-a).forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            filterYearEl.appendChild(option);
        });

        // Populate categories from the main form's dropdown
        const mainCategoryOptions = categoryInput.querySelectorAll('option');
        filterCategoryEl.innerHTML = '<option value="all">Toutes les catégories</option>';
        
        mainCategoryOptions.forEach(option => {
            if (option.value === "") return; // Skip placeholder
            
            const filterOption = document.createElement('option');
            filterOption.value = option.value;
            filterOption.textContent = option.textContent;
            filterCategoryEl.appendChild(filterOption);
        });
    }

    // --- Initial Load ---
    async function init() {
        // Charger les données depuis le serveur si connecté
        if (window.authService && window.authService.isUserAuthenticated()) {
            try {
                const serverExpenses = await window.authService.getData('expenses');
                if (serverExpenses && serverExpenses.length > 0) {
                    expenses = serverExpenses;
                    saveExpensesToStorage(); // Sauvegarder dans le stockage local de l'utilisateur
                    console.log('✅ Dépenses chargées depuis le serveur');
                } else {
                    // Vérifier s'il y a des données locales pour cet utilisateur
                    const storageKey = getExpensesStorageKey();
                    const localExpenses = JSON.parse(localStorage.getItem(storageKey)) || [];
                    if (localExpenses.length > 0) {
                        expenses = localExpenses;
                        console.log('✅ Dépenses chargées depuis le stockage local utilisateur');
                    } else {
                        loadExpenses(); // Charger depuis le stockage local générique si pas de données
                    }
                }
            } catch (error) {
                console.error('Erreur lors du chargement des dépenses:', error);
                loadExpenses(); // Fallback vers le stockage local
            }
        } else {
            loadExpenses(); // Charger depuis le stockage local pour les utilisateurs non connectés
        }
        
        resetForm();
        populateFilterOptions();
        render();
    }

    function updateStatCardColors(totalDamage, monthDamage, totalCracks, avgPain) {
        // Carte 1: Total des Dégâts (Solde)
        const totalDamageCard = totalDamageEl.closest('.stat-card');
        totalDamageCard.className = 'stat-card';
        
        if (totalDamage > 200) {
            totalDamageCard.classList.add('positive');
        } else if (totalDamage >= 0) {
            totalDamageCard.classList.add('warning');
        } else {
            totalDamageCard.classList.add('danger');
        }

        // Carte 2: Massacre du Mois - Toujours verte comme les dépenses inutiles
        const monthDamageCard = monthDamageEl.closest('.stat-card');
        monthDamageCard.className = 'stat-card';
        // Pas de classe de couleur ajoutée, reste verte par défaut

        // Carte 3: Nombre de Craquages
        const totalCracksCard = totalCracksEl.closest('.stat-card');
        totalCracksCard.className = 'stat-card';
        
        if (totalCracks === 0) {
            totalCracksCard.classList.add('positive');
        } else if (totalCracks <= 10) {
            totalCracksCard.classList.add('warning');
        } else {
            totalCracksCard.classList.add('danger');
        }

        // Carte 4: Douleur Moyenne
        const avgPainCard = avgPainEl.closest('.stat-card');
        avgPainCard.className = 'stat-card';
        
        if (avgPain > -50) {
            avgPainCard.classList.add('positive');
        } else if (avgPain > -150) {
            avgPainCard.classList.add('warning');
        } else {
            avgPainCard.classList.add('danger');
        }
    }

    init();

    // Écouter les événements de déconnexion
    window.addEventListener('userLogout', () => {
        // Recharger les données pour l'utilisateur local
        loadExpenses();
        render();
    });

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
        
        // Charger l'avatar après l'initialisation de l'authentification
        setTimeout(async () => {
            if (window.applyGlobalAvatar && window.AVATARS_CONFIG) {
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
                        console.log('🎭 Avatar initialisé sur script:', currentAvatarId);
                    } catch (error) {
                        console.error('Erreur lors de l\'initialisation de l\'avatar:', error);
                    }
                }
            }
        }, 500);
        
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
                    
                    // Synchroniser les données locales avec le serveur
                    await window.authService.syncLocalData();
                    
                    // Recharger les données avec les nouvelles données utilisateur
                    loadExpenses();
                    render();
                    
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
                    
                    // Recharger les données avec les nouvelles données utilisateur
                    loadExpenses();
                    render();
                    
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
                            <button class="user-menu-option delete-account" onclick="showDeleteAccountConfirmation();">
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
                                    console.log(`🎭 Avatar script récupéré de la base de données: ${currentAvatarId}`);
                                } else {
                                    console.log(`🎭 Aucun avatar script sauvegardé, utilisation par défaut`);
                                }
                            } else {
                                console.log(`🎭 Utilisateur non connecté, avatar script par défaut`);
                            }
                            
                            // Appliquer l'avatar
                            window.applyGlobalAvatar(avatarElement, currentAvatarId);
                            console.log('🎭 Avatar appliqué sur script:', currentAvatarId);
                        } catch (error) {
                            console.error('Erreur lors du chargement de l\'avatar:', error);
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

    // Fonction d'export PDF avec prise en compte des filtres
    function exportExpensesToPDF() {
        // Récupérer les dépenses filtrées
        const filteredExpenses = getFilteredExpenses();
        
        if (filteredExpenses.length === 0) {
            alert('Aucune dépense à exporter avec les filtres actuels !');
            return;
        }
        
        // Créer le PDF en mode paysage
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape' });
        
        // Configuration de la page
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        
        // Titre principal
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('FCKNGMoney - Rapport de Dépenses', pageWidth / 2, 30, { align: 'center' });
        
        // Sous-titre avec informations sur les filtres
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 40, { align: 'center' });
        
        // Informations sur les filtres appliqués
        const filterInfo = getFilterInfo();
        if (filterInfo) {
            doc.setFontSize(10);
            doc.text(`Filtres appliqués : ${filterInfo}`, pageWidth / 2, 50, { align: 'center' });
        }
        
        // Statistiques des données filtrées
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Statistiques des Données Filtrées', margin, 70);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const totalExpenses = filteredExpenses.filter(exp => exp.type === 'expense').length;
        const totalIncome = filteredExpenses.filter(exp => exp.type === 'income').length;
        const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        doc.text(`Nombre de dépenses : ${totalExpenses}`, margin, 85);
        doc.text(`Nombre de revenus : ${totalIncome}`, margin, 95);
        doc.text(`Solde total : ${totalAmount.toFixed(2)}€`, margin, 105);
        
        // Tableau des dépenses
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Détail des Dépenses', margin, 130);
        
        // Préparer les données pour le tableau
        const tableData = filteredExpenses.map(exp => {
            const date = new Date(exp.date).toLocaleDateString('fr-FR');
            const amount = exp.amount.toFixed(2) + '€';
            const type = exp.type === 'income' ? 'Revenu' : 'Dépense';
            const category = exp.category || 'Non catégorisé';
            const necessity = exp.necessity || 'Non spécifié';
            const comment = exp.description || '';
            
            return [date, exp.culprit, amount, type, category, necessity, comment];
        });
        
        // En-têtes du tableau
        const headers = ['Date', 'Coupable', 'Montant', 'Type', 'Catégorie', 'Nécessité', 'Commentaire'];
        
        // Créer le tableau avec autoTable
        doc.autoTable({
            head: [headers],
            body: tableData,
            startY: 140,
            margin: { left: margin, right: margin },
            styles: {
                fontSize: 8,
                cellPadding: 3
            },
            headStyles: {
                fillColor: [118, 185, 0], // Couleur verte FCKNGMoney
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            columnStyles: {
                0: { cellWidth: 25 }, // Date
                1: { cellWidth: 30 }, // Coupable
                2: { cellWidth: 25 }, // Montant
                3: { cellWidth: 20 }, // Type
                4: { cellWidth: 35 }, // Catégorie
                5: { cellWidth: 35 }, // Nécessité
                6: { cellWidth: 80 } // Commentaire (plus large)
            },
            didDrawPage: function(data) {
                // Ajouter le numéro de page
                doc.setFontSize(8);
                doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margin, doc.internal.pageSize.height - 10);
            }
        });
        
        // Sauvegarder le PDF
        const filterSuffix = filterInfo ? `_${filterInfo.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
        const fileName = `FCKNGMoney_Rapport_${new Date().toISOString().split('T')[0]}${filterSuffix}.pdf`;
        doc.save(fileName);
    }
    
    // Fonction pour obtenir les informations sur les filtres appliqués
    function getFilterInfo() {
        const filters = [];
        
        if (filterYearEl.value !== 'all') {
            filters.push(`Année ${filterYearEl.value}`);
        }
        if (filterMonthEl.value !== 'all') {
            const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                               'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
            filters.push(monthNames[parseInt(filterMonthEl.value)]);
        }
        if (filterCategoryEl.value !== 'all') {
            filters.push(filterCategoryEl.value);
        }
        if (filterCulpritEl.value.trim() !== '') {
            filters.push(`Coupable: ${filterCulpritEl.value}`);
        }
        
        return filters.length > 0 ? filters.join(', ') : null;
    }

    // Fonction pour afficher la popup de confirmation de suppression de compte
    function showDeleteAccountConfirmation() {
        console.log('🔍 showDeleteAccountConfirmation appelée');
        
        // Vérifier que l'utilisateur est connecté
        if (!window.authService || !window.authService.isUserAuthenticated()) {
            console.error('❌ Utilisateur non connecté');
            alert('Tu dois être connecté pour supprimer ton compte');
            return;
        }
        
        // Créer la popup si elle n'existe pas
        let deletePopup = document.getElementById('delete-account-popup');
        if (!deletePopup) {
            console.log('📝 Création de la popup de suppression');
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
                console.log('💀 Bouton de suppression cliqué');
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<span class="icon">⏳</span> Suppression en cours...';
                
                try {
                    console.log('📡 Appel de deleteAccount...');
                    const result = await window.authService.deleteAccount();
                    console.log('📡 Résultat:', result);
                    
                    if (result.success) {
                        deletePopup.classList.remove('active');
                        showAuthMessage('💀 Compte supprimé avec succès. Adieu, dépensier !', 'success');
                        updateAuthButton();
                        render();
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
                console.log('😅 Annulation de la suppression');
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
        console.log('🎭 Affichage de la popup');
        deletePopup.classList.add('active');
    }

    // Fonction pour ouvrir le coffre quotidien
    function openDailyChest() {
        console.log('📦 Fonction coffre quotidien appelée');
        
        // Créer la popup si elle n'existe pas
        let chestPopup = document.getElementById('daily-chest-popup');
        if (!chestPopup) {
            console.log('📦 Création de la popup du coffre quotidien');
            chestPopup = document.createElement('div');
            chestPopup.id = 'daily-chest-popup';
            chestPopup.className = 'popup-overlay';
            chestPopup.innerHTML = `
                <div class="popup-content daily-chest-popup">
                    <div class="popup-header">
                        <h2>📦 Ouvre vite ton coffre quotidien !</h2>
                        <button class="popup-close-btn" id="close-daily-chest-popup">×</button>
                    </div>
                    <div class="chest-content">
                        <div class="chest-icon" id="clickable-chest">📦</div>
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
            clickableChest.addEventListener('click', () => {
                openChest(chestPopup);
            });
        }
        
        // Afficher la popup
        console.log('📦 Affichage de la popup du coffre');
        chestPopup.classList.add('active');
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
    
    // Fonction pour sauvegarder les points dans la base de données
    async function saveChestPoints(points) {
        try {
            if (window.authService && window.authService.isUserAuthenticated()) {
                const user = window.authService.getCurrentUser();
                const currentPoints = await window.authService.getData('chest_points') || 0;
                const newTotal = currentPoints + points;
                
                await window.authService.setData('chest_points', newTotal);
                console.log(`📦 Points du coffre sauvegardés: ${currentPoints} + ${points} = ${newTotal}`);
            }
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde des points du coffre:', error);
        }
    }

    // Exposer les fonctions globalement
    window.showDeleteAccountConfirmation = showDeleteAccountConfirmation;
    window.openDailyChest = openDailyChest;
}); 