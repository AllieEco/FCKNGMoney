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
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');

    // Stats Elements
    const totalDamageEl = document.getElementById('total-damage');
    const monthDamageEl = document.getElementById('month-damage');
    const totalCracksEl = document.getElementById('total-cracks');
    const avgPainEl = document.getElementById('avg-pain');
    const currentMonthEl = document.getElementById('current-month');

    // Data Store
    let expenses = JSON.parse(localStorage.getItem('fckng_expenses_v2')) || [];

    // --- Main Submit Handler (Add & Edit) ---
    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const expenseData = {
            culprit: culpritInput.value,
            date: crimeDateInput.value,
            category: categoryInput.value,
            paymentMethod: paymentMethodInput.value,
            amount: parseFloat(amountInput.value),
            description: descriptionInput.value
        };
        
        // Basic Validation
        if (!expenseData.culprit || !expenseData.date || !expenseData.category || isNaN(expenseData.amount) || expenseData.amount <= 0) {
            alert('Les champs "Coupable", "Date", "Catégorie" et "Butin" sont obligatoires, et le butin doit être positif, espèce de malade.');
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
            amountInput.value = expense.amount;
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

    // --- Core Functions ---
    function saveExpensesToLocalStorage() {
        localStorage.setItem('fckng_expenses_v2', JSON.stringify(expenses));
    }

    function resetForm() {
        expenseForm.reset();
        expenseIdInput.value = '';
        crimeDateInput.value = new Date().toISOString().split('T')[0];
        submitBtn.textContent = "J'assume (c'est la faute à Macron)";
    }
    
    function render() {
        renderTable();
        calculateStats();
    }

    function renderTable() {
        historyBody.innerHTML = '';
        if (expenses.length === 0) {
            historyBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;">Aucun crime financier à déclarer. Pour l'instant...</td></tr>`;
            return;
        }

        expenses.forEach(expense => {
            const row = document.createElement('tr');
            row.dataset.id = expense.id;
            row.innerHTML = `
                <td>${new Date(expense.date).toLocaleDateString()}</td>
                <td>${expense.culprit}</td>
                <td>${expense.category}</td>
                <td><strong>${expense.amount.toFixed(2)}€</strong></td>
                <td>${expense.paymentMethod}</td>
                <td class="actions-cell">
                    <button class="edit-btn" title="Modifier">✏️</button>
                    <button class="delete-btn" title="Supprimer">🗑️</button>
                </td>
            `;
            historyBody.appendChild(row);
        });
    }

    function calculateStats() {
        const totalDamage = expenses.reduce((acc, exp) => acc + exp.amount, 0);
        const totalCracks = expenses.length;
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthDamage = expenses
            .filter(exp => {
                const expDate = new Date(exp.date);
                return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
            })
            .reduce((acc, exp) => acc + exp.amount, 0);

        totalDamageEl.textContent = `${totalDamage.toFixed(2)}€`;
        monthDamageEl.textContent = `${monthDamage.toFixed(2)}€`;
        totalCracksEl.textContent = totalCracks;
        avgPainEl.textContent = totalCracks > 0 ? `${(totalDamage / totalCracks).toFixed(2)}€` : '0.00€';
        currentMonthEl.textContent = now.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    }

    // --- Initial Load ---
    function init() {
        resetForm();
        render();
    }

    init();
}); 