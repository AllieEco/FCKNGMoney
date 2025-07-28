// Composant popup d'authentification réutilisable
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Initialisation de l\'authentification...');
    
    // Vérifier que le bouton existe
    const authBtn = document.getElementById('auth-btn');
    if (!authBtn) {
        console.error('❌ Bouton d\'authentification non trouvé');
        return;
    }
    
    // Créer la popup si elle n'existe pas
    if (!document.getElementById('auth-popup')) {
        createAuthPopup();
    }
    
    // Configurer les événements
    setupAuthEvents();
    
    // Mettre à jour l'état du bouton
    updateAuthButton();
    
    // Écouter les événements de déconnexion
    window.addEventListener('userLogout', () => {
        // Recharger les données de la page
        if (typeof reloadPageData === 'function') {
            reloadPageData();
        }
    });
    
    console.log('✅ Authentification initialisée avec succès');
});

function createAuthPopup() {
    const popupHTML = `
        <div class="popup-overlay" id="auth-popup">
            <div class="popup-content auth-popup-content">
                <div class="auth-tabs">
                    <button class="auth-tab active" data-tab="login">Se Connecter</button>
                    <button class="auth-tab" data-tab="register">S'inscrire</button>
                </div>
                
                <!-- FORMULAIRE DE CONNEXION -->
                <form id="login-form" class="auth-form">
                    <div class="login-header">
                        <h3>🖕 Connexion</h3>
                        <img src="assets/images/ptdrtki.gif" alt="PTDRTKI" class="login-gif">
                    </div>
                    <p class="auth-subtitle">Alors, tu te souviens de tes identifiants ou pas ?</p>
                    <div class="form-group">
                        <label for="login-email">Ton Email</label>
                        <input type="email" id="login-email" placeholder="ton.email@example.com" required>
                    </div>
                    <div class="form-group">
                        <label for="login-password">Ton Mot de Passe</label>
                        <input type="password" id="login-password" placeholder="Le mot de passe que t'as choisi" required>
                    </div>
                    <button type="submit" class="auth-submit-btn">Se Connecter</button>
                </form>

                <!-- FORMULAIRE D'INSCRIPTION -->
                <form id="register-form" class="auth-form" style="display: none;">
                    <h3>💸 Inscription</h3>
                    <p class="auth-subtitle">Allez, on va te créer un compte pour que tu puisses perdre ton argent partout !</p>
                    <div class="form-group">
                        <label for="register-email">Ton Email</label>
                        <input type="email" id="register-email" placeholder="ton.email@example.com" required>
                    </div>
                    <div class="form-group">
                        <label for="register-password">Ton Mot de Passe</label>
                        <input type="password" id="register-password" placeholder="Choisis un truc sécurisé" required>
                        <small class="password-requirements">Doit contenir : 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial</small>
                    </div>
                    <div class="form-group">
                        <label for="register-password-confirm">Confirme Ton Mot de Passe</label>
                        <input type="password" id="register-password-confirm" placeholder="Répète le même truc" required>
                    </div>
                    <div class="form-group">
                        <label for="register-unique-id">Ton Identifiant Unique</label>
                        <input type="text" id="register-unique-id" placeholder="Un truc cool et unique" required>
                        <small>Cet identifiant doit être unique et ne peut pas être modifié (comme tes dettes)</small>
                    </div>
                    <button type="submit" class="auth-submit-btn">Créer Mon Compte</button>
                </form>

                <button class="popup-close-btn" id="auth-close">×</button>
            </div>
        </div>

        <!-- POPUP D'INITIALISATION DU COMPTE -->
        <div class="popup-overlay" id="init-popup" style="display: none;">
            <div class="popup-content init-popup-content">
                <h3>🎯 Initialisation de Ton Compte</h3>
                <p class="init-subtitle">Allez, on va configurer ton profil pour que FCKNGMoney te connaisse mieux !</p>
                
                <form id="init-form" class="init-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="init-firstname">Ton Prénom</label>
                            <input type="text" id="init-firstname" placeholder="Ton prénom" required>
                        </div>
                        <div class="form-group">
                            <label for="init-lastname">Ton Nom</label>
                            <input type="text" id="init-lastname" placeholder="Ton nom" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="init-age">Ton Âge</label>
                            <input type="number" id="init-age" placeholder="25" min="13" max="120" required>
                        </div>
                        <div class="form-group">
                            <label for="init-balance">Ton Solde Bancaire Actuel (€)</label>
                            <input type="number" id="init-balance" placeholder="1500.00" step="0.01" min="0" required>
                        </div>
                    </div>

                    <!-- AVERTISSEMENTS -->
                    <div class="warning-section">
                        <h4>⚠️ AVERTISSEMENTS IMPORTANTS</h4>
                        <div class="warning-box">
                            <p><strong>FCKNGMoney n'est PAS un conseiller financier !</strong></p>
                            <p>Cette application est un outil de suivi personnel et humoristique. Elle ne remplace en aucun cas les conseils d'un professionnel de la finance.</p>
                        </div>
                        <div class="warning-box">
                            <p><strong>Si tu as de vrais problèmes d'argent :</strong></p>
                            <ul>
                                <li>Parle-en à un conseiller financier</li>
                                <li>Contacte une association d'aide aux consommateurs</li>
                                <li>Consulte un travailleur social</li>
                                <li>N'hésite pas à demander de l'aide à des personnes compétentes</li>
                            </ul>
                        </div>
                    </div>

                    <!-- CONDITIONS -->
                    <div class="terms-section">
                        <div class="form-group checkbox-group">
                            <input type="checkbox" id="accept-terms" required>
                            <label for="accept-terms">
                                J'accepte que FCKNGMoney soit un outil humoristique et non un conseiller financier. 
                                Je comprends que pour de vrais problèmes d'argent, je dois consulter des professionnels compétents.
                            </label>
                        </div>
                        <div class="form-group checkbox-group">
                            <input type="checkbox" id="accept-data" required>
                            <label for="accept-data">
                                J'accepte que mes données soient stockées localement et sur le serveur pour le bon fonctionnement de l'application.
                            </label>
                        </div>
                    </div>

                    <button type="submit" class="init-submit-btn">Finaliser Mon Compte</button>
                </form>

                <button class="popup-close-btn" id="init-close">×</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    console.log('📱 Popup d\'authentification et d\'initialisation créées');
}

function setupAuthEvents() {
    const authBtn = document.getElementById('auth-btn');
    const authPopup = document.getElementById('auth-popup');
    const authClose = document.getElementById('auth-close');
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
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
                    console.log('🎭 Avatar initialisé sur auth-popup:', currentAvatarId);
                } catch (error) {
                    console.error('Erreur lors de l\'initialisation de l\'avatar:', error);
                }
            }
        }
    }, 500);
    
    // Ouvrir la popup d'authentification
    authBtn.addEventListener('click', function() {
        console.log('🔘 Bouton d\'authentification cliqué');
        
        // Vérifier que le service d'authentification est disponible
        if (!window.authService) {
            console.error('❌ Service d\'authentification non disponible');
            alert('Erreur: Service d\'authentification non chargé');
            return;
        }
        
        console.log('État de connexion:', window.authService.isUserAuthenticated());
        
        if (!window.authService.isUserAuthenticated()) {
            // Si non connecté, ouvrir la popup
            console.log('📱 Ouverture de la popup d\'authentification');
            authPopup.classList.add('active');
        }
        // Si connecté, le menu s'ouvre via les événements du menu utilisateur
    });
    
    // Fermer la popup
    authClose.addEventListener('click', function() {
        authPopup.classList.remove('active');
        clearAuthMessages();
    });
    
    // Fermer en cliquant à l'extérieur
    authPopup.addEventListener('click', function(e) {
        if (e.target === authPopup) {
            authPopup.classList.remove('active');
            clearAuthMessages();
        }
    });
    
    // Gestion des onglets
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
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
    loginForm.addEventListener('submit', async function(e) {
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
                
                // Recharger les données selon la page
                reloadPageData();
                
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
    registerForm.addEventListener('submit', async function(e) {
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
                // Fermer la popup d'authentification
                authPopup.classList.remove('active');
                clearAuthMessages();
                
                // Afficher la popup d'initialisation
                showInitPopup();
            } else {
                showAuthMessage(result.message, 'error');
            }
        } catch (error) {
            // Si l'utilisateur est connecté malgré tout, ne pas afficher d'erreur
            if (window.authService && window.authService.isUserAuthenticated()) {
                return;
            }
            showAuthMessage('💥 Erreur d\'inscription - Le serveur a encore bu trop de café', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'S\'inscrire';
        }
    });
}

// Fonction pour gérer la déconnexion
function handleLogout() {
    // Nettoyer les données de l'utilisateur connecté
    if (window.authService && window.authService.getCurrentUser()) {
        const user = window.authService.getCurrentUser();
        const userStorageKey = `expenses_${user.email}`;
        localStorage.removeItem(userStorageKey);
    }
    
    // Déconnecter l'utilisateur
    window.authService.logout();
    
    // Recharger les données de la page
    if (typeof reloadPageData === 'function') {
        reloadPageData();
    }
    
    // Mettre à jour l'interface
    updateAuthButton();
}

// Fonction pour mettre à jour le bouton d'authentification
function updateAuthButton() {
    const authBtn = document.getElementById('auth-btn');
    
    if (window.authService && window.authService.isUserAuthenticated()) {
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
                        // Récupérer l'avatar depuis la base de données
                        let currentAvatarId = 'default';
                        
                        if (window.authService && window.authService.isUserAuthenticated()) {
                            const savedAvatar = await window.authService.getData('selectedAvatar');
                            if (savedAvatar) {
                                currentAvatarId = savedAvatar;
                                console.log(`🎭 Avatar auth-popup récupéré de la base de données: ${currentAvatarId}`);
                            } else {
                                console.log(`🎭 Aucun avatar auth-popup sauvegardé, utilisation par défaut`);
                            }
                        } else {
                            console.log(`🎭 Utilisateur non connecté, avatar auth-popup par défaut`);
                        }
                        
                        // Appliquer l'avatar
                        window.applyGlobalAvatar(avatarElement, currentAvatarId);
                        console.log('🎭 Avatar appliqué sur auth-popup:', currentAvatarId);
                    } catch (error) {
                        console.error('Erreur lors du chargement de l\'avatar:', error);
                    }
                }
            }
            
            // Mettre à jour le bouton de thème
            updateThemeButton();
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
        passwordInput.addEventListener('input', function() {
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
        passwordConfirmInput.addEventListener('input', function() {
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

    // Fonction pour afficher la popup d'initialisation
    function showInitPopup() {
        const initPopup = document.getElementById('init-popup');
        const initForm = document.getElementById('init-form');
        const initClose = document.getElementById('init-close');
        
        // Afficher la popup
        initPopup.style.display = 'flex';
        initPopup.classList.add('active');
        
        // Gérer la fermeture
        initClose.addEventListener('click', () => {
            initPopup.classList.remove('active');
            setTimeout(() => {
                initPopup.style.display = 'none';
            }, 300);
        });
        
        // Fermer en cliquant à l'extérieur
        initPopup.addEventListener('click', (e) => {
            if (e.target === initPopup) {
                initPopup.classList.remove('active');
                setTimeout(() => {
                    initPopup.style.display = 'none';
                }, 300);
            }
        });
        
        // Gérer la soumission du formulaire
        initForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const firstname = document.getElementById('init-firstname').value;
            const lastname = document.getElementById('init-lastname').value;
            const age = parseInt(document.getElementById('init-age').value);
            const balance = parseFloat(document.getElementById('init-balance').value);
            const acceptTerms = document.getElementById('accept-terms').checked;
            const acceptData = document.getElementById('accept-data').checked;
            
            if (!acceptTerms || !acceptData) {
                alert('Tu dois accepter les conditions pour continuer !');
                return;
            }
            
            // Créer l'objet de configuration
            const userConfig = {
                firstName: firstname,
                lastName: lastname,
                age: age,
                initialBalance: balance,
                warningThreshold: 200,
                dangerThreshold: 0,
                customMessages: {
                    positive: "C'est bon on est laaaaarge",
                    warning: "Fais gaffe à pas pousser le bouchon trop loin",
                    danger: "OSKOUR !"
                }
            };
            
            try {
                // Sauvegarder la configuration
                await window.authService.saveConfig(userConfig);
                
                // Mettre à jour l'utilisateur local
                const currentUser = window.authService.getCurrentUser();
                currentUser.config = userConfig;
                window.authService.saveCurrentUser(currentUser);
                
                // Fermer la popup
                initPopup.classList.remove('active');
                setTimeout(() => {
                    initPopup.style.display = 'none';
                }, 300);
                
                // Afficher le message de succès
                showAuthMessage('🎉 Compte initialisé avec succès ! Bienvenue dans la famille des dépensiers !', 'success');
                updateAuthButton();
                
                // Synchroniser les données locales avec le serveur
                await window.authService.syncLocalData();
                
                // Recharger les données selon la page
                reloadPageData();
                
                setTimeout(() => {
                    clearAuthMessages();
                }, 3000);
                
            } catch (error) {
                console.error('Erreur lors de l\'initialisation:', error);
                alert('Erreur lors de l\'initialisation du compte. Réessaie !');
            }
        });
    }

    // Fonction pour recharger les données selon la page
    function reloadPageData() {
        // Détecter la page actuelle et recharger les données appropriées
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        switch (currentPage) {
            case 'index.html':
            case '':
                if (typeof window.loadDashboardData === 'function') {
                    window.loadDashboardData();
                }
                break;
            case 'achat.html':
                if (typeof window.render === 'function') {
                    window.render();
                }
                break;
            case 'rpghetto.html':
                if (typeof window.loadMonthlyChallenges === 'function') {
                    window.loadMonthlyChallenges();
                }
                // Mettre à jour l'état du bouton d'authentification
                updateAuthButton();
                break;
        }
    }

    // Fonction pour afficher la popup de confirmation de suppression de compte
    function showDeleteAccountConfirmation() {
        console.log('🔍 showDeleteAccountConfirmation appelée (auth-popup)');
        
        // Vérifier que l'utilisateur est connecté
        if (!window.authService || !window.authService.isUserAuthenticated()) {
            console.error('❌ Utilisateur non connecté');
            alert('Tu dois être connecté pour supprimer ton compte');
            return;
        }
        
        // Créer la popup si elle n'existe pas
        let deletePopup = document.getElementById('delete-account-popup');
        if (!deletePopup) {
            console.log('📝 Création de la popup de suppression (auth-popup)');
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
                console.log('💀 Bouton de suppression cliqué (auth-popup)');
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<span class="icon">⏳</span> Suppression en cours...';
                
                try {
                    console.log('📡 Appel de deleteAccount... (auth-popup)');
                    const result = await window.authService.deleteAccount();
                    console.log('📡 Résultat:', result);
                    
                    if (result.success) {
                        deletePopup.classList.remove('active');
                        showAuthMessage('💀 Compte supprimé avec succès. Adieu, dépensier !', 'success');
                        updateAuthButton();
                        // Recharger la page pour revenir à l'état initial
                        window.location.reload();
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
                console.log('😅 Annulation de la suppression (auth-popup)');
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
        console.log('🎭 Affichage de la popup (auth-popup)');
        deletePopup.classList.add('active');
    }

    // Exposer la fonction globalement
    window.showDeleteAccountConfirmation = showDeleteAccountConfirmation;