# ⚙️ Configuration de FCKNGMoney

## 📝 Comment configurer ton site

### 1. Éditer le fichier `config.js`

Ouvre le fichier `config.js` à la racine du projet et modifie les valeurs selon tes informations :

```javascript
const USER_CONFIG = {
    // Informations personnelles
    firstName: "John",           // Remplace par ton prénom
    lastName: "Doe",             // Remplace par ton nom
    
    // État financier initial
    initialBalance: 1500.00,     // Remplace par ton solde bancaire actuel
    
    // Seuils d'alerte (optionnel)
    warningThreshold: 200,       // Seuil d'alerte en euros
    dangerThreshold: 0,          // Seuil de danger en euros
    
    // Messages personnalisés (optionnel)
    customMessages: {
        positive: "C'est bon on est laaaaarge",
        warning: "Fais gaffe à pas pousser le bouchon trop loin",
        danger: "OSKOUR !"
    }
};
```

### 2. Paramètres disponibles

#### 🔤 Informations personnelles
- `firstName` : Ton prénom (pour de futures fonctionnalités)
- `lastName` : Ton nom de famille (pour de futures fonctionnalités)

#### 💰 État financier
- `initialBalance` : Ton solde bancaire actuel en euros
  - Exemple : `1500.00` pour 1500€
  - Le site calculera automatiquement : solde initial + revenus - dépenses

#### ⚠️ Seuils d'alerte (optionnel)
- `warningThreshold` : Seuil d'alerte en euros (défaut : 200€)
- `dangerThreshold` : Seuil de danger en euros (défaut : 0€)

#### 💬 Messages personnalisés (optionnel)
- `customMessages.positive` : Message quand solde > warningThreshold
- `customMessages.warning` : Message quand solde entre danger et warning
- `customMessages.danger` : Message quand solde < dangerThreshold

### 3. Exemples de configuration

#### Configuration basique
```javascript
const USER_CONFIG = {
    firstName: "Alice",
    lastName: "Martin",
    initialBalance: 2500.00
};
```

#### Configuration complète
```javascript
const USER_CONFIG = {
    firstName: "Bob",
    lastName: "Dupont",
    initialBalance: 800.00,
    warningThreshold: 500,
    dangerThreshold: -100,
    customMessages: {
        positive: "T'es un boss !",
        warning: "Attention, ça commence à faire mal...",
        danger: "Tu es dans le rouge mon pote !"
    }
};
```

### 4. Sauvegarde

- Les données de configuration sont locales
- Tes transactions sont sauvegardées dans le navigateur
- Modifie la config à tout moment pour ajuster ton solde initial

### 5. Prochaines fonctionnalités

Le nom et prénom seront utilisés pour :
- Messages personnalisés
- Statistiques personnalisées
- Fonctionnalités sociales (futur)
- Export de données personnalisées

---

**Note** : Modifie la configuration avant d'ajouter tes premières dépenses pour avoir un solde de départ correct ! 