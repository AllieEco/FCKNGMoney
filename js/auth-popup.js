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
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    console.log('📱 Popup d\'authentification créée');
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
        
        if (window.authService.isUserAuthenticated()) {
            // Si connecté, proposer la déconnexion
            if (confirm('Voulez-vous vous déconnecter ?')) {
                window.authService.logout();
                updateAuthButton();
                // Recharger les données selon la page
                reloadPageData();
            }
        } else {
            // Si non connecté, ouvrir la popup
            console.log('📱 Ouverture de la popup d\'authentification');
            authPopup.classList.add('active');
        }
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
                showAuthMessage('🎉 Inscription réussie ! Bienvenue dans la famille des dépensiers !', 'success');
                updateAuthButton();
                
                // Synchroniser les données locales avec le serveur
                await window.authService.syncLocalData();
                
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

// Fonction pour mettre à jour le bouton d'authentification
function updateAuthButton() {
    const authBtn = document.getElementById('auth-btn');
    
    if (window.authService && window.authService.isUserAuthenticated()) {
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