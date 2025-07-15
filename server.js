const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Servir les fichiers statiques

// Base de données simple (fichier JSON)
const DB_FILE = 'users.json';

// Fonction pour charger les utilisateurs
function loadUsers() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
    }
    return {};
}

// Fonction pour sauvegarder les utilisateurs
function saveUsers(users) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des utilisateurs:', error);
    }
}

// Route d'inscription
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, uniqueId } = req.body;
        
        if (!email || !password || !uniqueId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email, mot de passe et identifiant unique requis' 
            });
        }

        const users = loadUsers();
        
        // Vérifier si l'email existe déjà
        if (users[email]) {
            return res.status(400).json({ 
                success: false, 
                message: 'Un compte avec cet email existe déjà' 
            });
        }

        // Vérifier si l'identifiant unique existe déjà
        const existingUser = Object.values(users).find(user => user.uniqueId === uniqueId);
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cet identifiant unique est déjà utilisé' 
            });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Créer le nouvel utilisateur
        const newUser = {
            id: uuidv4(),
            email,
            password: hashedPassword,
            uniqueId,
            createdAt: new Date().toISOString(),
            expenses: [],
            challenges: {},
            config: {
                firstName: "",
                lastName: "",
                initialBalance: 0,
                warningThreshold: 200,
                dangerThreshold: 0,
                customMessages: {
                    positive: "C'est bon on est laaaaarge",
                    warning: "Fais gaffe à pas pousser le bouchon trop loin",
                    danger: "OSKOUR !"
                }
            }
        };

        users[email] = newUser;
        saveUsers(users);

        res.json({ 
            success: true, 
            message: 'Compte créé avec succès',
            user: {
                id: newUser.id,
                email: newUser.email,
                uniqueId: newUser.uniqueId
            }
        });

    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur lors de l\'inscription' 
        });
    }
});

// Route de connexion
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email et mot de passe requis' 
            });
        }

        const users = loadUsers();
        const user = users[email];

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email ou mot de passe incorrect' 
            });
        }

        // Vérifier le mot de passe
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email ou mot de passe incorrect' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Connexion réussie',
            user: {
                id: user.id,
                email: user.email,
                uniqueId: user.uniqueId,
                config: user.config
            }
        });

    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur lors de la connexion' 
        });
    }
});

// Route pour sauvegarder les données utilisateur
app.post('/api/save-data', (req, res) => {
    try {
        const { email, dataType, data } = req.body;
        
        if (!email || !dataType || data === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email, type de données et données requis' 
            });
        }

        const users = loadUsers();
        const user = users[email];

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Utilisateur non trouvé' 
            });
        }

        // Sauvegarder les données selon le type
        switch (dataType) {
            case 'expenses':
                user.expenses = data;
                break;
            case 'challenges':
                user.challenges = data;
                break;
            case 'config':
                user.config = data;
                break;
            default:
                return res.status(400).json({ 
                    success: false, 
                    message: 'Type de données non reconnu' 
                });
        }

        saveUsers(users);

        res.json({ 
            success: true, 
            message: 'Données sauvegardées avec succès' 
        });

    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur lors de la sauvegarde' 
        });
    }
});

// Route pour récupérer les données utilisateur
app.get('/api/get-data/:email/:dataType', (req, res) => {
    try {
        const { email, dataType } = req.params;
        
        const users = loadUsers();
        const user = users[email];

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Utilisateur non trouvé' 
            });
        }

        let data;
        switch (dataType) {
            case 'expenses':
                data = user.expenses || [];
                break;
            case 'challenges':
                data = user.challenges || {};
                break;
            case 'config':
                data = user.config || {};
                break;
            default:
                return res.status(400).json({ 
                    success: false, 
                    message: 'Type de données non reconnu' 
                });
        }

        res.json({ 
            success: true, 
            data 
        });

    } catch (error) {
        console.error('Erreur lors de la récupération:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur lors de la récupération' 
        });
    }
});

// Route pour vérifier si un identifiant unique est disponible
app.get('/api/check-unique-id/:uniqueId', (req, res) => {
    try {
        const { uniqueId } = req.params;
        
        const users = loadUsers();
        const existingUser = Object.values(users).find(user => user.uniqueId === uniqueId);

        res.json({ 
            success: true, 
            available: !existingUser 
        });

    } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur lors de la vérification' 
        });
    }
});

// Route pour récupérer la configuration utilisateur
app.get('/api/user-config/:email', (req, res) => {
    try {
        const { email } = req.params;
        
        const users = loadUsers();
        const user = users[email];

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Utilisateur non trouvé' 
            });
        }

        res.json({ 
            success: true, 
            config: user.config 
        });

    } catch (error) {
        console.error('Erreur lors de la récupération de la config:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur lors de la récupération de la config' 
        });
    }
});

// Route pour sauvegarder la configuration utilisateur
app.post('/api/save-config', (req, res) => {
    try {
        const { email, config } = req.body;
        
        if (!email || !config) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email et configuration requis' 
            });
        }

        const users = loadUsers();
        const user = users[email];

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Utilisateur non trouvé' 
            });
        }

        user.config = config;
        saveUsers(users);

        res.json({ 
            success: true, 
            message: 'Configuration sauvegardée avec succès' 
        });

    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la config:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur lors de la sauvegarde de la config' 
        });
    }
});

// Route racine pour servir l'application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur FCKNGMoney démarré sur le port ${PORT}`);
    console.log(`📱 Accédez à l'application: http://localhost:${PORT}`);
}); 