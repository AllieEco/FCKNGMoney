// Configuration personnalisée pour FCKNGMoney
// Modifie ces valeurs selon tes informations

const USER_CONFIG = {
    // Informations personnelles
    firstName: "John",           // Ton prénom
    lastName: "Doe",             // Ton nom de famille
    
    // État financier initial
    initialBalance: 1500.00,     // Ton solde bancaire actuel (en euros)
    
    // Seuils d'alerte personnalisés (optionnel)
    warningThreshold: 200,       // Seuil d'alerte (défaut: 200€)
    dangerThreshold: 0,          // Seuil de danger (défaut: 0€)
    
    // Messages personnalisés (optionnel)
    customMessages: {
        positive: "C'est bon on est laaaaarge",           // Solde > warningThreshold
        warning: "Fais gaffe à pas pousser le bouchon trop loin",  // Solde entre danger et warning
        danger: "OSKOUR !"                                // Solde < dangerThreshold
    }
};

// Ne pas modifier cette ligne
if (typeof module !== 'undefined' && module.exports) {
    module.exports = USER_CONFIG;
} 