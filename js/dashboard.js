// Dashboard JavaScript pour FCKNGMoney
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
});

function loadDashboardData() {
    // Récupérer les données depuis le localStorage
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    
    // Calculer les données du tableau de bord
    const dashboardData = calculateDashboardData(expenses);
    
    // Mettre à jour l'affichage
    updateDashboardDisplay(dashboardData);
    
    // Calculer et afficher les stats de criminels financiers
    updateCriminalStats(expenses);
}

function calculateDashboardData(expenses) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    let totalBalance = 0;
    let monthlyCracks = 0;
    let unnecessarySpending = 0;
    
    expenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        const amount = parseFloat(expense.amount);
        
        // Calculer le solde total
        if (expense.transactionType === 'income') {
            totalBalance += amount;
        } else {
            totalBalance -= amount;
        }
        
        // Compter les craquages du mois en cours
        if (expenseDate.getMonth() === currentMonth && 
            expenseDate.getFullYear() === currentYear &&
            expense.transactionType === 'expense') {
            monthlyCracks++;
        }
        
        // Calculer les dépenses inutiles
        if (expense.necessity === 'Pose pas de questions qui fâchent' && 
            expense.transactionType === 'expense') {
            unnecessarySpending += amount;
        }
    });
    
    return {
        balance: totalBalance,
        monthlyCracks: monthlyCracks,
        unnecessarySpending: unnecessarySpending
    };
}

function updateDashboardDisplay(data) {
    // Mettre à jour l'état du compte
    updateAccountStatus(data.balance);
    
    // Mettre à jour le nombre de craquages
    updateMonthlyCracks(data.monthlyCracks);
    
    // Mettre à jour les dépenses inutiles
    updateUnnecessarySpending(data.unnecessarySpending);
}

function updateAccountStatus(balance) {
    const balanceElement = document.getElementById('current-balance');
    const messageElement = document.getElementById('balance-message');
    const cardElement = document.getElementById('account-status-card');
    
    // Formater le solde
    balanceElement.textContent = `${balance.toFixed(2)}€`;
    
    // Déterminer le message et la classe CSS selon le solde
    let message = '';
    let statusClass = '';
    
    if (balance > 200) {
        message = "C'est bon on est laaaaarge";
        statusClass = 'positive';
    } else if (balance >= 0) {
        message = "Fais gaffe à pas pousser le bouchon trop loin";
        statusClass = 'warning';
    } else {
        message = "OSKOUR !";
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
    const expenseOnly = expenses.filter(exp => exp.amount < 0);
    
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
               exp.amount < 0; // Seulement les dépenses
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

// Exposer la fonction pour qu'elle soit accessible depuis d'autres scripts
window.refreshDashboard = refreshDashboard; 