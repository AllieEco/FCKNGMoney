// Service d'authentification pour FCKNGMoney
class AuthService {
    constructor() {
        // URL automatique : localhost en développement, Vercel en production
        this.baseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api' 
            : `${window.location.origin}/api`;
        this.currentUser = null;
        this.isAuthenticated = false;
        
        // Charger l'utilisateur connecté depuis le localStorage
        this.loadCurrentUser();
    }

    // Charger l'utilisateur depuis le localStorage
    loadCurrentUser() {
        const savedUser = localStorage.getItem('fckngmoney_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.isAuthenticated = true;
        }
    }

    // Sauvegarder l'utilisateur dans le localStorage
    saveCurrentUser(user) {
        this.currentUser = user;
        this.isAuthenticated = true;
        localStorage.setItem('fckngmoney_user', JSON.stringify(user));
        
        // Déclencher un événement de connexion
        window.dispatchEvent(new CustomEvent('userLogin'));
    }

    // Vérifier si un identifiant unique est disponible
    async checkUniqueId(uniqueId) {
        try {
            const response = await fetch(`${this.baseUrl}/check-unique-id/${uniqueId}`);
            const data = await response.json();
            return data.success && data.available;
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'identifiant:', error);
            return false;
        }
    }

    // Inscription d'un nouvel utilisateur
    async register(email, password, uniqueId) {
        try {
            const response = await fetch(`${this.baseUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, uniqueId })
            });

            const data = await response.json();
            
            if (data.success) {
                this.saveCurrentUser(data.user);
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            return { success: false, message: 'Erreur de connexion au serveur' };
        }
    }

    // Connexion d'un utilisateur
    async login(email, password) {
        try {
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (data.success) {
                this.saveCurrentUser(data.user);
                return { success: true, message: data.message, user: data.user };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            return { success: false, message: 'Erreur de connexion au serveur' };
        }
    }

    // Déconnexion
    logout() {
        // Sauvegarder les données de l'utilisateur avant de se déconnecter
        if (this.currentUser) {
            const userStorageKey = `expenses_${this.currentUser.email}`;
            const userExpenses = localStorage.getItem(userStorageKey);
            if (userExpenses) {
                // Garder les données utilisateur pour une reconnexion ultérieure
                console.log('💾 Données utilisateur conservées pour reconnexion');
            }
        }
        
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('fckngmoney_user');
        
        // Effacer les défis
        const challengeKeys = Object.keys(localStorage).filter(key => key.startsWith('challenge_'));
        challengeKeys.forEach(key => localStorage.removeItem(key));
        
        // Revenir au mode local
        this.switchToLocalMode();
        
        // Déclencher un événement personnalisé pour notifier la déconnexion
        window.dispatchEvent(new CustomEvent('userLogout'));
    }

    // Sauvegarder des données sur le serveur
    async saveData(dataType, data) {
        if (!this.isAuthenticated || !this.currentUser) {
            console.warn('Utilisateur non connecté, sauvegarde locale uniquement');
            return false;
        }

        try {
            const response = await fetch(`${this.baseUrl}/save-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: this.currentUser.email,
                    dataType,
                    data
                })
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            return false;
        }
    }

    // Récupérer des données depuis le serveur
    async getData(dataType) {
        if (!this.isAuthenticated || !this.currentUser) {
            console.warn('Utilisateur non connecté, récupération locale uniquement');
            return null;
        }

        try {
            const response = await fetch(`${this.baseUrl}/get-data/${this.currentUser.email}/${dataType}`);
            const data = await response.json();
            
            if (data.success) {
                return data.data;
            } else {
                console.error('Erreur lors de la récupération:', data.message);
                return null;
            }
        } catch (error) {
            console.error('Erreur lors de la récupération:', error);
            return null;
        }
    }

    // Sauvegarder la configuration utilisateur
    async saveConfig(config) {
        if (!this.isAuthenticated || !this.currentUser) {
            console.warn('Utilisateur non connecté, sauvegarde locale uniquement');
            return false;
        }

        try {
            const response = await fetch(`${this.baseUrl}/save-config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: this.currentUser.email,
                    config
                })
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la config:', error);
            return false;
        }
    }

    // Récupérer la configuration utilisateur avec fallback
    async getUserConfig() {
        if (this.isAuthenticated && this.currentUser) {
            try {
                const config = await this.getConfig();
                if (config) {
                    return config;
                }
            } catch (error) {
                console.warn('Erreur lors de la récupération de la config, utilisation des valeurs par défaut');
            }
        }
        
        // Configuration par défaut si pas d'utilisateur connecté ou pas de config
        return {
            firstName: "",
            lastName: "",
            age: 25,
            initialBalance: 0,
            warningThreshold: 200,
            dangerThreshold: 0,
            customMessages: {
                positive: "C'est bon on est laaaaarge",
                warning: "Fais gaffe à pas pousser le bouchon trop loin",
                danger: "OSKOUR !"
            }
        };
    }

    // Récupérer la configuration utilisateur
    async getConfig() {
        if (!this.isAuthenticated || !this.currentUser) {
            console.warn('Utilisateur non connecté, configuration locale uniquement');
            return null;
        }

        try {
            const response = await fetch(`${this.baseUrl}/user-config/${this.currentUser.email}`);
            const data = await response.json();
            
            if (data.success) {
                return data.config;
            } else {
                console.error('Erreur lors de la récupération de la config:', data.message);
                return null;
            }
        } catch (error) {
            console.error('Erreur lors de la récupération de la config:', error);
            return null;
        }
    }

    // Synchroniser les données locales avec le serveur
    async syncLocalData() {
        if (!this.isAuthenticated) return;

        try {
            // Synchroniser les dépenses
            const userStorageKey = `expenses_${this.currentUser.email}`;
            const localExpenses = JSON.parse(localStorage.getItem(userStorageKey)) || [];
            if (localExpenses.length > 0) {
                await this.saveData('expenses', localExpenses);
                console.log('✅ Dépenses synchronisées');
            }

            // Synchroniser les défis
            const challenges = {};
            const challengeKeys = Object.keys(localStorage).filter(key => key.startsWith('challenge_'));
            challengeKeys.forEach(key => {
                const challengeId = key.replace('challenge_', '').replace('_completed', '').replace('_failed', '');
                if (!challenges[challengeId]) {
                    challenges[challengeId] = {};
                }
                if (key.includes('_completed')) {
                    challenges[challengeId].completed = localStorage.getItem(key) === 'true';
                }
                if (key.includes('_failed')) {
                    challenges[challengeId].failed = localStorage.getItem(key) === 'true';
                }
            });
            
            if (Object.keys(challenges).length > 0) {
                await this.saveData('challenges', challenges);
                console.log('✅ Défis synchronisés');
            }

            // Synchroniser la configuration
            const localConfig = window.USER_CONFIG || {};
            if (localConfig.firstName || localConfig.lastName || localConfig.initialBalance !== undefined) {
                await this.saveConfig(localConfig);
                console.log('✅ Configuration synchronisée');
            }

        } catch (error) {
            console.error('Erreur lors de la synchronisation:', error);
        }
    }

    // Charger les données depuis le serveur vers le localStorage
    async loadServerData() {
        if (!this.isAuthenticated) return;

        try {
            // Charger les dépenses
            const serverExpenses = await this.getData('expenses');
            if (serverExpenses && serverExpenses.length > 0) {
                const userStorageKey = `expenses_${this.currentUser.email}`;
                localStorage.setItem(userStorageKey, JSON.stringify(serverExpenses));
                console.log('✅ Dépenses chargées depuis le serveur');
            }

            // Charger les défis
            const serverChallenges = await this.getData('challenges');
            if (serverChallenges) {
                Object.keys(serverChallenges).forEach(challengeId => {
                    const challenge = serverChallenges[challengeId];
                    if (challenge.completed) {
                        localStorage.setItem(`challenge_${challengeId}_completed`, 'true');
                    }
                    if (challenge.failed) {
                        localStorage.setItem(`challenge_${challengeId}_failed`, 'true');
                    }
                });
                console.log('✅ Défis chargés depuis le serveur');
            }

            // Charger la configuration
            const serverConfig = await this.getConfig();
            if (serverConfig) {
                // Mettre à jour la configuration globale
                window.USER_CONFIG = { ...window.USER_CONFIG, ...serverConfig };
                console.log('✅ Configuration chargée depuis le serveur');
            }

        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        }
    }

    // Basculer en mode local (quand l'utilisateur se déconnecte)
    switchToLocalMode() {
        console.log('🔄 Passage en mode local');
        // Les données restent dans le localStorage pour un usage local
    }

    // Obtenir l'utilisateur actuel
    getCurrentUser() {
        return this.currentUser;
    }

    // Vérifier si l'utilisateur est connecté
    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    // Supprimer le compte utilisateur
    async deleteAccount() {
        console.log('🗑️ deleteAccount appelée');
        console.log('👤 Utilisateur actuel:', this.currentUser);
        console.log('🔐 Authentifié:', this.isAuthenticated);
        
        if (!this.isAuthenticated || !this.currentUser) {
            console.error('❌ Utilisateur non connecté');
            return { success: false, message: 'Utilisateur non connecté' };
        }

        try {
            console.log('📡 Envoi de la requête DELETE à:', `${this.baseUrl}/delete-account`);
            console.log('📧 Email à supprimer:', this.currentUser.email);
            
            const response = await fetch(`${this.baseUrl}/delete-account`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: this.currentUser.email })
            });

            console.log('📡 Réponse reçue, status:', response.status);
            const data = await response.json();
            console.log('📡 Données reçues:', data);
            
            if (data.success) {
                console.log('✅ Suppression réussie, déconnexion...');
                // Déconnecter l'utilisateur après suppression
                this.logout();
                return { success: true, message: data.message };
            } else {
                console.error('❌ Erreur de suppression:', data.message);
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('❌ Erreur lors de la suppression du compte:', error);
            return { success: false, message: 'Erreur de connexion au serveur' };
        }
    }
}

// Créer une instance globale du service d'authentification
window.authService = new AuthService(); 