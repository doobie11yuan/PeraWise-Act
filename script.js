const menuBtn = document.getElementById('menuBtn');
const navMenu = document.getElementById('navMenu');
const themeBtn = document.getElementById('themeBtn');

const budgetDisplay = document.getElementById('budgetDisplay');
const spentDisplay = document.getElementById('spentDisplay');
const remainingDisplay = document.getElementById('remainingDisplay');
const progressBar = document.getElementById('progressBar');
const budgetMessage = document.getElementById('budgetMessage');
const budgetForm = document.getElementById('budgetForm');
const budgetInput = document.getElementById('budgetInput');

const expenseForm = document.getElementById('expenseForm');
const expenseDesc = document.getElementById('expenseDesc');
const expenseAmount = document.getElementById('expenseAmount');
const expenseCategory = document.getElementById('expenseCategory');
const expenseDate = document.getElementById('expenseDate');
const expenseSubmitBtn = document.getElementById('expenseSubmitBtn');
const expenseError = document.getElementById('expenseError');
const filterCategory = document.getElementById('filterCategory');
const sortExpenses = document.getElementById('sortExpenses');
const expenseList = document.getElementById('expenseList');
const categoryTotals = document.getElementById('categoryTotals');
const clearExpensesBtn = document.getElementById('clearExpensesBtn');
const exportBtn = document.getElementById('exportBtn');
const expenseActionMessage = document.getElementById('expenseActionMessage');

const splitForm = document.getElementById('splitForm');
const billAmount = document.getElementById('billAmount');
const peopleCount = document.getElementById('peopleCount');
const tipPercent = document.getElementById('tipPercent');
const splitResult = document.getElementById('splitResult');

const contactForm = document.getElementById('contactForm');
const contactName = document.getElementById('contactName');
const contactEmail = document.getElementById('contactEmail');
const contactMessage = document.getElementById('contactMessage');
const nameError = document.getElementById('nameError');
const emailError = document.getElementById('emailError');
const messageError = document.getElementById('messageError');
const formSuccess = document.getElementById('formSuccess');

let budget = Number(localStorage.getItem('perawise-budget')) || 0;
let expenses = JSON.parse(localStorage.getItem('perawise-expenses')) || [];
let editingExpenseId = null;

function saveData() {
    localStorage.setItem('perawise-budget', budget);
    localStorage.setItem('perawise-expenses', JSON.stringify(expenses));
}

function formatPeso(amount) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(amount);
}

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function formatExpenseDate(dateString) {
    if (!dateString) return '';

    const parts = dateString.split('-');

    if (parts.length !== 3) return dateString;

    return `${parts[1]}/${parts[2]}/${parts[0]}`;
}

function updateSummary() {
    const spent = expenses.reduce(function (sum, item) {
        return sum + Number(item.amount);
    }, 0);

    const remaining = budget - spent;
    const percent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

    budgetDisplay.textContent = formatPeso(budget);
    spentDisplay.textContent = formatPeso(spent);
    remainingDisplay.textContent = formatPeso(remaining);

    remainingDisplay.classList.toggle('negative', remaining < 0);

    progressBar.style.width = percent + '%';
    progressBar.classList.remove('warning', 'danger');

    if (budget === 0) {
        budgetMessage.textContent = 'Set a budget to start tracking your spending.';
    } else if (spent > budget) {
        progressBar.classList.add('danger');
        budgetMessage.textContent =
            'Over budget by ' + formatPeso(spent - budget) + '. Time to cut back!';
    } else if (percent >= 80) {
        progressBar.classList.add('warning');
        budgetMessage.textContent =
            'Careful! You have used ' + Math.round(percent) + '% of your budget.';
    } else {
        budgetMessage.textContent = 'You are on track. Keep it up!';
    }
}

function renderExpenses() {
    const selected = filterCategory.value;
    const sortValue = sortExpenses.value;

    let visible = expenses.filter(function (item) {
        return selected === 'All' || item.category === selected;
    });

    if (sortValue === 'amount-high') {
        visible.sort(function (a, b) {
            return Number(b.amount) - Number(a.amount);
        });
    } else if (sortValue === 'amount-low') {
        visible.sort(function (a, b) {
            return Number(a.amount) - Number(b.amount);
        });
    } else {
        visible.sort(function (a, b) {
            return Number(b.id) - Number(a.id);
        });
    }

    expenseList.innerHTML = '';

    if (visible.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'empty';
        empty.textContent = 'No expenses to show yet.';
        expenseList.appendChild(empty);
        return;
    }

    visible.forEach(function (item) {
        const li = document.createElement('li');
        li.className = 'expense-item';

        const info = document.createElement('div');
        info.className = 'expense-info';

        const title = document.createElement('strong');
        title.textContent = item.description;

        const meta = document.createElement('span');
        meta.className = 'meta';
        meta.textContent = item.category + ' • ' + formatExpenseDate(item.date);

        info.append(title, meta);

        const amount = document.createElement('span');
        amount.className = 'expense-amount';
        amount.textContent = formatPeso(Number(item.amount));

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.dataset.id = item.id;
        editBtn.textContent = 'Edit';
        editBtn.type = 'button';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.dataset.id = item.id;
        deleteBtn.textContent = 'Delete';
        deleteBtn.type = 'button';

        li.append(info, amount, editBtn, deleteBtn);
        expenseList.appendChild(li);
    });
}

function renderCategoryTotals() {
    const categories = ['Food', 'Transport', 'School', 'Bills', 'Others'];

    categoryTotals.innerHTML = '';

    categories.forEach(function (category) {
        const total = expenses.reduce(function (sum, item) {
            if (item.category === category) {
                return sum + Number(item.amount);
            }

            return sum;
        }, 0);

        const card = document.createElement('div');
        card.className = 'category-total';

        const label = document.createElement('span');
        label.textContent = category;

        const amount = document.createElement('strong');
        amount.textContent = formatPeso(total);

        card.append(label, amount);
        categoryTotals.appendChild(card);
    });
}

function refreshExpenseViews() {
    renderExpenses();
    renderCategoryTotals();
    updateSummary();
}

budgetForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const value = parseFloat(budgetInput.value);

    if (isNaN(value) || value <= 0) {
        alert('Please enter a budget greater than zero.');
        return;
    }

    budget = value;
    saveData();
    updateSummary();
    budgetForm.reset();
});

expenseForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const description = expenseDesc.value.trim();
    const amount = parseFloat(expenseAmount.value);
    const category = expenseCategory.value;
    const date = expenseDate.value || getTodayDate();

    if (description === '' || isNaN(amount) || amount <= 0) {
        expenseError.textContent =
            'Enter a description and an amount greater than zero.';
        return;
    }

    expenseError.textContent = '';

    if (editingExpenseId !== null) {
        expenses = expenses.map(function (item) {
            if (String(item.id) === String(editingExpenseId)) {
                return {
                    id: item.id,
                    description: description,
                    amount: amount,
                    category: category,
                    date: date
                };
            }

            return item;
        });

        expenseActionMessage.textContent = 'Expense updated.';
        editingExpenseId = null;
        expenseSubmitBtn.textContent = 'Add';
    } else {
        const newExpense = {
            id: Date.now(),
            description: description,
            amount: amount,
            category: category,
            date: date
        };

        expenses.unshift(newExpense);
        expenseActionMessage.textContent = 'Expense added.';
    }

    saveData();
    refreshExpenseViews();
    expenseForm.reset();
    expenseDate.value = getTodayDate();
});

expenseList.addEventListener('click', function (event) {
    const target = event.target;

    if (target.classList.contains('delete-btn')) {
        const id = target.dataset.id;

        expenses = expenses.filter(function (item) {
            return String(item.id) !== String(id);
        });

        if (String(editingExpenseId) === String(id)) {
            editingExpenseId = null;
            expenseForm.reset();
            expenseSubmitBtn.textContent = 'Add';
        }

        saveData();
        refreshExpenseViews();
        expenseActionMessage.textContent = 'Expense deleted.';
    }

    if (target.classList.contains('edit-btn')) {
        const id = target.dataset.id;

        const item = expenses.find(function (expense) {
            return String(expense.id) === String(id);
        });

        if (item) {
            editingExpenseId = item.id;
            expenseDesc.value = item.description;
            expenseAmount.value = item.amount;
            expenseCategory.value = item.category;
            expenseDate.value = item.date || getTodayDate();
            expenseSubmitBtn.textContent = 'Save Changes';
            expenseError.textContent = '';
            expenseActionMessage.textContent =
                'Edit the fields above, then select Save Changes.';
            expenseDesc.focus();
        }
    }
});

filterCategory.addEventListener('change', renderExpenses);
sortExpenses.addEventListener('change', renderExpenses);

clearExpensesBtn.addEventListener('click', function () {
    if (expenses.length === 0) {
        expenseActionMessage.textContent = 'There are no expenses to clear.';
        return;
    }

    if (confirm('Are you sure you want to clear all expenses?')) {
        expenses = [];
        editingExpenseId = null;

        saveData();
        refreshExpenseViews();

        expenseForm.reset();
        expenseDate.value = getTodayDate();
        expenseSubmitBtn.textContent = 'Add';

        expenseActionMessage.textContent = 'All expenses have been cleared.';
    }
});

exportBtn.addEventListener('click', function () {
    if (expenses.length === 0) {
        expenseActionMessage.textContent = 'There are no expenses to download.';
        return;
    }

    function escapeCSV(value) {
        return '"' + String(value ?? '').replace(/"/g, '""') + '"';
    }

    const rows = [
        ['Description', 'Amount', 'Category', 'Date'],
        ...expenses.map(function (item) {
            return [
                item.description,
                Number(item.amount).toFixed(2),
                item.category,
                item.date
            ];
        })
    ];

    const csv = rows.map(function (row) {
        return row.map(escapeCSV).join(',');
    }).join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], {
        type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'perawise-expenses.csv';

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    expenseActionMessage.textContent = 'CSV download started.';
});

splitForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const bill = parseFloat(billAmount.value);
    const people = parseInt(peopleCount.value, 10);
    const tipRate = parseFloat(tipPercent.value) || 0;

    if (isNaN(bill) || bill <= 0 || isNaN(people) || people < 1 || tipRate < 0) {
        splitResult.textContent =
            'Please enter a valid bill, number of people, and tip.';
        return;
    }

    const tip = bill * (tipRate / 100);
    const total = bill + tip;
    const perPerson = total / people;

    splitResult.textContent =
        `Total with tip: ${formatPeso(total)} | Each person pays: ${formatPeso(perPerson)}`;
});

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

contactForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const name = contactName.value.trim();
    const email = contactEmail.value.trim();
    const message = contactMessage.value.trim();

    let isValid = true;

    nameError.textContent = '';
    emailError.textContent = '';
    messageError.textContent = '';
    formSuccess.textContent = '';

    if (name.length < 2) {
        nameError.textContent = 'Please enter your name (at least 2 letters).';
        isValid = false;
    }

    if (!isValidEmail(email)) {
        emailError.textContent = 'Please enter a valid email address.';
        isValid = false;
    }

    if (message.length < 10) {
        messageError.textContent = 'Your message should be at least 10 characters.';
        isValid = false;
    }

    if (isValid) {
        formSuccess.textContent =
            `Thank you, ${name}! Your message has been received.`;
        contactForm.reset();
    }
});

menuBtn.addEventListener('click', function () {
    navMenu.classList.toggle('open');
});

navMenu.addEventListener('click', function (event) {
    if (event.target.tagName === 'A') {
        navMenu.classList.remove('open');
    }
});

function applyTheme(isDark) {
    document.body.classList.toggle('dark', isDark);
    themeBtn.textContent = isDark ? 'Light Mode' : 'Dark Mode';
}

themeBtn.addEventListener('click', function () {
    const isDark = !document.body.classList.contains('dark');

    applyTheme(isDark);

    localStorage.setItem('perawise-theme', isDark ? 'dark' : 'light');
});

applyTheme(localStorage.getItem('perawise-theme') === 'dark');

document.getElementById('year').textContent = new Date().getFullYear();

expenseDate.value = getTodayDate();
updateSummary();
renderExpenses();
renderCategoryTotals();