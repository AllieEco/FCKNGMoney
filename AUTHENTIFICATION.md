# 🔐 Système d'Authentification FCKNGMoney

## Vue d'ensemble

Le système d'authentification permet de sauvegarder vos données (dépenses, défis, configuration) sur un serveur plutôt que localement dans votre navigateur. Ainsi, vous pouvez accéder à vos données depuis n'importe quel appareil !

## 🚀 Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Démarrer le serveur

```bash
npm start
```

Le serveur démarre sur `http://localhost:3000`

### 3. Accéder à l'application

Ouvrez votre navigateur et allez sur `http://localhost:3000`

## 🔑 Fonctionnalités

### Inscription
- **Email** : Votre adresse email (unique)
- **Mot de passe** : Votre mot de passe sécurisé
- **Identifiant unique** : Un identifiant personnalisé (unique, ne peut pas être modifié)

### Connexion
- Utilisez votre email et mot de passe pour vous connecter
- Vos données sont automatiquement synchronisées

### Synchronisation
- **Dépenses** : Toutes vos dépenses sont sauvegardées sur le serveur
- **Défis** : L'état de vos défis mensuels est synchronisé
- **Configuration** : Vos paramètres personnalisés sont sauvegardés

## 🎯 Utilisation

### Bouton de connexion
- Situé dans la navigation (après "RPGhetto")
- Affiche "Se Connecter" si non connecté
- Affiche "Déconnexion (email)" si connecté

### Mode local vs serveur
- **Mode local** : Les données restent dans votre navigateur (comme avant)
- **Mode serveur** : Les données sont synchronisées avec le serveur

### Synchronisation automatique
- Lors de la connexion : les données du serveur remplacent les données locales
- Lors de l'inscription : les données locales sont envoyées au serveur
- À chaque modification : les données sont automatiquement synchronisées

## 🔒 Sécurité

- **Mots de passe** : Hashés avec bcrypt
- **Données** : Stockées localement sur le serveur (fichier JSON)
- **Connexion** : Session maintenue via localStorage

## 📁 Structure des données

### Utilisateur
```json
{
  "email": "user@example.com",
  "password": "hashed_password",
  "uniqueId": "mon_identifiant_unique",
  "expenses": [...],
  "challenges": {...},
  "config": {...}
}
```

### Défis
```json
{
  "ruin-starbucks": {
    "completed": true,
    "failed": false
  }
}
```

## 🛠️ Développement

### Serveur
- **Port** : 3000 (configurable via variable d'environnement PORT)
- **Base de données** : Fichier `users.json`
- **API** : RESTful avec Express.js

### Endpoints API
- `POST /api/register` - Inscription
- `POST /api/login` - Connexion
- `POST /api/save-data` - Sauvegarder des données
- `GET /api/get-data/:email/:dataType` - Récupérer des données
- `GET /api/check-unique-id/:uniqueId` - Vérifier un identifiant unique

## 🔧 Configuration

### Variables d'environnement
- `PORT` : Port du serveur (défaut: 3000)

### Fichier de configuration
- `config.js` : Configuration utilisateur (nom, solde initial, etc.)

## 🐛 Dépannage

### Problèmes courants

1. **Serveur ne démarre pas**
   - Vérifiez que Node.js est installé
   - Vérifiez que les dépendances sont installées (`npm install`)

2. **Erreur de connexion**
   - Vérifiez que le serveur est démarré
   - Vérifiez l'URL dans `js/auth.js` (défaut: `http://localhost:3000/api`)

3. **Données non synchronisées**
   - Vérifiez votre connexion internet
   - Vérifiez les logs du serveur

### Logs
- **Serveur** : Affiche les requêtes et erreurs dans la console
- **Client** : Affiche les erreurs dans la console du navigateur

## 📝 Notes importantes

- Les données locales ne sont jamais supprimées
- En cas de déconnexion, vous revenez au mode local
- L'identifiant unique ne peut pas être modifié après inscription
- Le serveur utilise un fichier JSON simple (pas de base de données complexe)

## 🔄 Migration depuis l'ancienne version

1. Vos données locales restent intactes
2. Lors de votre première inscription, vos données sont automatiquement synchronisées
3. Vous pouvez continuer à utiliser l'application en mode local si vous le souhaitez

## 🎉 Avantages

- ✅ Accès multi-appareils
- ✅ Sauvegarde sécurisée
- ✅ Synchronisation automatique
- ✅ Mode local toujours disponible
- ✅ Interface utilisateur intuitive
- ✅ Pas de perte de données 