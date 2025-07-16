// Charger les variables d'environnement
require('dotenv').config();

const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const config = require('./config');

const app = express();
const PORT = config.app.port;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Servir les fichiers statiques

// Connexion MongoDB
let db;
let client;

async function connectToMongoDB() {
    try {
        client = new MongoClient(config.mongodb.uri);
        await client.connect();
        db = client.db(config.mongodb.dbName);
        console.log('✅ Connecté à MongoDB Atlas');
    } catch (error) {
        console.error('❌ Erreur de connexion MongoDB:', error);
        process.exit(1);
    }
}

// Fonction pour obtenir la collection users
function getUsersCollection() {
    return db.collection(config.mongodb.collectionName);
}

// Route de santé
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'FCKNGMoney API is running!',
        timestamp: new Date().toISOString(),
        database: 'MongoDB Atlas'
    });
});

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

        const usersCollection = getUsersCollection();
        
        // Vérifier si l'email existe déjà
        const existingUserByEmail = await usersCollection.findOne({ email });
        if (existingUserByEmail) {
            return res.status(400).json({ 
                success: false, 
                message: 'Un compte avec cet email existe déjà' 
            });
        }

        // Vérifier si l'identifiant unique existe déjà
        const existingUserById = await usersCollection.findOne({ uniqueId });
        if (existingUserById) {
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

        await usersCollection.insertOne(newUser);

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

        const usersCollection = getUsersCollection();
        const user = await usersCollection.findOne({ email });

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
app.post('/api/save-data', async (req, res) => {
    try {
        const { email, dataType, data } = req.body;
        
        if (!email || !dataType || data === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email, type de données et données requis' 
            });
        }

        const usersCollection = getUsersCollection();
        const user = await usersCollection.findOne({ email });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Utilisateur non trouvé' 
            });
        }

        // Sauvegarder les données selon le type
        const updateData = {};
        switch (dataType) {
            case 'expenses':
                updateData.expenses = data;
                break;
            case 'challenges':
                updateData.challenges = data;
                break;
            case 'config':
                updateData.config = data;
                break;
            default:
                return res.status(400).json({ 
                    success: false, 
                    message: 'Type de données non reconnu' 
                });
        }

        await usersCollection.updateOne(
            { email },
            { $set: updateData }
        );

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
app.get('/api/get-data/:email/:dataType', async (req, res) => {
    try {
        const { email, dataType } = req.params;
        
        const usersCollection = getUsersCollection();
        const user = await usersCollection.findOne({ email });

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
app.get('/api/check-unique-id/:uniqueId', async (req, res) => {
    try {
        const { uniqueId } = req.params;
        
        const usersCollection = getUsersCollection();
        const existingUser = await usersCollection.findOne({ uniqueId });

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
app.get('/api/user-config/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        const usersCollection = getUsersCollection();
        const user = await usersCollection.findOne({ email });

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
app.post('/api/save-config', async (req, res) => {
    try {
        const { email, config: userConfig } = req.body;
        
        if (!email || !userConfig) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email et configuration requis' 
            });
        }

        const usersCollection = getUsersCollection();
        const user = await usersCollection.findOne({ email });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Utilisateur non trouvé' 
            });
        }

        await usersCollection.updateOne(
            { email },
            { $set: { config: userConfig } }
        );

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

// Route pour supprimer un compte utilisateur
app.delete('/api/delete-account', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email requis' 
            });
        }

        const usersCollection = getUsersCollection();
        const user = await usersCollection.findOne({ email });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Utilisateur non trouvé' 
            });
        }

        // Supprimer l'utilisateur de la base de données
        await usersCollection.deleteOne({ email });

        res.json({ 
            success: true, 
            message: 'Compte supprimé avec succès' 
        });

    } catch (error) {
        console.error('Erreur lors de la suppression du compte:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur lors de la suppression du compte' 
        });
    }
});

// Démarrer le serveur
async function startServer() {
    await connectToMongoDB();
    
    app.listen(PORT, () => {
        console.log(`🚀 Serveur FCKNGMoney démarré sur le port ${PORT}`);
        console.log(`📊 Base de données: MongoDB Atlas`);
        console.log(`🌐 URL: http://localhost:${PORT}`);
    });
}

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
    console.log('\n🛑 Arrêt du serveur...');
    if (client) {
        await client.close();
        console.log('✅ Connexion MongoDB fermée');
    }
    process.exit(0);
});

startServer().catch(console.error); 