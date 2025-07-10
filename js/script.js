document.addEventListener('DOMContentLoaded', () => {

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

    // Stats Elements
    const totalDamageEl = document.getElementById('total-damage');
    const monthDamageEl = document.getElementById('month-damage');
    const totalCracksEl = document.getElementById('total-cracks');
    const avgPainEl = document.getElementById('avg-pain');
    const currentMonthEl = document.getElementById('current-month');

    // Data Store
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

    // --- Main Submit Handler (Add & Edit) ---
    expenseForm.addEventListener('submit', (e) => {
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

        saveExpensesToLocalStorage();
        render();
        resetForm();
    });

    // --- Event Delegation for Edit & Delete in Table ---
    historyBody.addEventListener('click', (e) => {
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
                saveExpensesToLocalStorage();
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

    // --- Core Functions ---
    function saveExpensesToLocalStorage() {
        localStorage.setItem('expenses', JSON.stringify(expenses));
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

            if (expense.category) {
                const categoryClass = expense.category
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .toLowerCase()
                    .replace(/[()&']/g, "")
                    .replace(/\s+/g, "-")
                    .replace(/--+/g, "-");
                row.classList.add(categoryClass);
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
        
        const expenseOnly = statsExpenses.filter(exp => exp.amount < 0);
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
    function init() {
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
}); 