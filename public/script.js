document.addEventListener('DOMContentLoaded', () => {
    const ratesBody = document.getElementById('ratesBody');
    const ratesLoader = document.getElementById('ratesLoader');
    const ratesErrorMessageElement = document.getElementById('ratesErrorMessage');

    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const registerMessage = document.getElementById('registerMessage');
    const loginMessage = document.getElementById('loginMessage');
    const authFormsContainer = document.getElementById('authForms');
    const userInfoDiv = document.getElementById('userInfo');
    const userNameSpan = document.getElementById('userName');
    const logoutButton = document.getElementById('logoutButton');
    const balancesList = document.getElementById('balancesList');

    const exchangeSection = document.getElementById('exchangeSection');
    const exchangeForm = document.getElementById('exchangeForm');
    const fromCurrencySelect = document.getElementById('fromCurrency');
    const toCurrencySelect = document.getElementById('toCurrency');
    const amountToExchangeInput = document.getElementById('amountToExchange');
    const exchangeMessage = document.getElementById('exchangeMessage');
    const transactionHistoryDiv = document.getElementById('transactionHistory');
    const transactionsList = document.getElementById('transactionsList');

    const protectedActionDiv = document.querySelector('.protected-action');
    const fetchProfileButton = document.getElementById('fetchProfileButton');
    const profileMessage = document.getElementById('profileMessage');

    const API_BASE_URL = 'http://127.0.0.1:3000';
    const NBP_API_URL = `${API_BASE_URL}/api/rates`;
    const AUTH_API_URL = `${API_BASE_URL}/api/auth`;
    const TRANSACTIONS_API_URL = `${API_BASE_URL}/api/transactions`;

    let jwtToken = localStorage.getItem('jwtToken');
    let currentUserData = null; 
    let availableCurrencies = ['PLN', 'USD', 'EUR', 'GBP', 'CHF']; 

    const showMessage = (element, message, isSuccess = true) => {
        element.textContent = message;
        element.className = 'message ' + (isSuccess ? 'success' : 'error');
    };
    const clearMessage = (element) => {
        element.textContent = '';
        element.className = 'message';
    };

    const populateCurrencySelects = () => {
        availableCurrencies.forEach(currency => {
            const optionFrom = document.createElement('option');
            optionFrom.value = currency;
            optionFrom.textContent = currency;
            fromCurrencySelect.appendChild(optionFrom);

            const optionTo = document.createElement('option');
            optionTo.value = currency;
            optionTo.textContent = currency;
            toCurrencySelect.appendChild(optionTo);
        });
        if (availableCurrencies.length > 1) {
            fromCurrencySelect.value = availableCurrencies[0]; 
            toCurrencySelect.value = availableCurrencies[1]; 
        }
    };


    const displayUserBalances = () => {
        balancesList.innerHTML = '';
        if (currentUserData && currentUserData.balances) {
            for (const currency in currentUserData.balances) {
                const listItem = document.createElement('li');
                listItem.textContent = `${currency}: ${currentUserData.balances[currency].toFixed(2)}`;
                balancesList.appendChild(listItem);
            }
        }
    };

    const displayTransactionHistory = () => {
        transactionsList.innerHTML = '';
        if (currentUserData && currentUserData.transactions && currentUserData.transactions.length > 0) {
            transactionHistoryDiv.style.display = 'block';
            currentUserData.transactions.slice().reverse().forEach(tx => { 
                const listItem = document.createElement('li');
                const date = new Date(tx.date).toLocaleString('pl-PL');
                listItem.innerHTML = `
                    <div class="transaction-row">
                        <div>${date}</div>
                        <div>Sprzedano: ${tx.amountSold.toFixed(2)} ${tx.fromCurrency} | Otrzymano: ${tx.amountReceived.toFixed(2)} ${tx.toCurrency}</div>
                        <div>Kurs ${tx.fromCurrency !== 'PLN' ? tx.fromCurrency + '/PLN: ' + tx.rateUsed.fromPLN.toFixed(4) : ''} ${tx.toCurrency !== 'PLN' ? tx.toCurrency + '/PLN: ' + tx.rateUsed.toPLN.toFixed(4) : ''}</div>
                    </div>
                `;
                transactionsList.appendChild(listItem);
            });
        } else {
            transactionHistoryDiv.style.display = 'none';
        }
    };


    const updateUIForAuthState = () => {
        if (jwtToken && currentUserData) {
            authFormsContainer.style.display = 'none';
            userInfoDiv.style.display = 'block';
            userNameSpan.textContent = currentUserData.name || currentUserData.email.split('@')[0];
            displayUserBalances();
            displayTransactionHistory();
            exchangeSection.style.display = 'block';
            protectedActionDiv.style.display = 'block';
        } else {
            authFormsContainer.style.display = 'flex';
            userInfoDiv.style.display = 'none';
            exchangeSection.style.display = 'none';
            transactionHistoryDiv.style.display = 'none';
            protectedActionDiv.style.display = 'none';
            userNameSpan.textContent = '';
            balancesList.innerHTML = '';
            transactionsList.innerHTML = '';
            currentUserData = null;
        }
    };

    const displayRatesError = (message) => {
        ratesErrorMessageElement.textContent = message;
        ratesErrorMessageElement.style.display = 'block';
        ratesBody.innerHTML = '';
    };
    const clearRatesError = () => {
        ratesErrorMessageElement.textContent = '';
        ratesErrorMessageElement.style.display = 'none';
    };

    const fetchAndDisplayRates = async () => {
        ratesLoader.style.display = 'block';
        clearRatesError();
        ratesBody.innerHTML = '';
        try {
            const response = await fetch(NBP_API_URL);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Błąd serwera NBP: ${response.status}` }));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const rates = await response.json();
            if (rates && rates.length > 0) {
                rates.forEach(rate => {
                    const rateRow = document.createElement('div');
                    rateRow.classList.add('rate-row');
                    rateRow.innerHTML = `
                        <div class="rate-currency">${rate.currency}</div>
                        <div class="rate-code">${rate.code}</div>
                        <div class="rate-value">${typeof rate.mid === 'number' ? rate.mid.toFixed(4) : 'N/A'}</div>
                    `;
                    ratesBody.appendChild(rateRow);
                });
            } else {
                displayRatesError('Brak dostępnych kursów walut.');
            }
        } catch (error) {
            console.error('Błąd podczas pobierania kursów NBP:', error);
            displayRatesError(`Nie udało się załadować kursów NBP: ${error.message}`);
        } finally {
            ratesLoader.style.display = 'none';
        }
    };

    const fetchUserProfile = async () => {
        if (!jwtToken) return null;
        try {
            const response = await fetch(`${AUTH_API_URL}/me`, {
                headers: { 'Authorization': `Bearer ${jwtToken}` }
            });
            if (!response.ok) {
                if (response.status === 401) handleLogout();
                throw new Error( (await response.json()).message || 'Nie udało się pobrać profilu');
            }
            const profileData = await response.json();
           
        } catch (error) {
            console.error('Błąd pobierania profilu /me:', error);
            return null;
        }
    };


    const handleLoginSuccess = (data) => {
        jwtToken = data.token;
        currentUserData = data.user; 
        localStorage.setItem('jwtToken', jwtToken);
        localStorage.setItem('currentUserData', JSON.stringify(currentUserData)); 
        
        showMessage(loginMessage, data.message || 'Zalogowano pomyślnie!', true);
        loginForm.reset();
        updateUIForAuthState();
    };

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('currentUserData');
        jwtToken = null;
        currentUserData = null;
        updateUIForAuthState();
        clearMessage(loginMessage);
        clearMessage(profileMessage);
        clearMessage(exchangeMessage);
    };


    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearMessage(registerMessage);
            const name = registerForm.name.value;
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            try {
                const response = await fetch(`${AUTH_API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || `Błąd rejestracji: ${response.status}`);
                showMessage(registerMessage, data.message || 'Rejestracja pomyślna!', true);
           
                registerForm.reset();
            } catch (error) {
                console.error('Błąd rejestracji:', error);
                showMessage(registerMessage, error.message, false);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearMessage(loginMessage);
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            try {
                const response = await fetch(`${AUTH_API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || `Błąd logowania: ${response.status}`);
                handleLoginSuccess(data);
            } catch (error) {
                console.error('Błąd logowania:', error);
                showMessage(loginMessage, error.message, false);
                handleLogout();
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    if (exchangeForm) {
        exchangeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearMessage(exchangeMessage);

            if (!jwtToken || !currentUserData) {
                showMessage(exchangeMessage, 'Musisz być zalogowany, aby dokonać wymiany.', false);
                return;
            }

            const fromCurrency = fromCurrencySelect.value;
            const toCurrency = toCurrencySelect.value;
            const amount = parseFloat(amountToExchangeInput.value);

            if (isNaN(amount) || amount <= 0) {
                showMessage(exchangeMessage, 'Podaj poprawną kwotę.', false);
                return;
            }
            if (fromCurrency === toCurrency) {
                showMessage(exchangeMessage, 'Waluty muszą być różne.', false);
                return;
            }

            try {
                const response = await fetch(`${TRANSACTIONS_API_URL}/exchange`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${jwtToken}`
                    },
                    body: JSON.stringify({ fromCurrency, toCurrency, amount })
                });
                const data = await response.json();
                if (!response.ok) {
                     if (response.status === 401) handleLogout();
                    throw new Error(data.message || `Błąd wymiany: ${response.status}`);
                }
                showMessage(exchangeMessage, data.message || 'Wymiana pomyślna!', true);
               
                currentUserData.balances = data.updatedBalances;
                if (!currentUserData.transactions) currentUserData.transactions = [];
                currentUserData.transactions.push(data.transaction); 
                localStorage.setItem('currentUserData', JSON.stringify(currentUserData)); 

                displayUserBalances();
                displayTransactionHistory();
                exchangeForm.reset(); 
                
                if (availableCurrencies.length > 1) {
                    fromCurrencySelect.value = availableCurrencies[0];
                    toCurrencySelect.value = availableCurrencies[1];
                }


            } catch (error) {
                console.error('Błąd wymiany walut:', error);
                showMessage(exchangeMessage, error.message, false);
            }
        });
    }


    if (fetchProfileButton) {
        fetchProfileButton.addEventListener('click', async () => {
            clearMessage(profileMessage);
            const profile = await fetchUserProfile();
            if (profile) {
                 showMessage(profileMessage, `Profil /me: ID=${profile.id}, Email=${profile.email}`, true);
            } else {
                if(!jwtToken) showMessage(profileMessage, 'Musisz być zalogowany.', false);
            }
        });
    }

    const initializeApp = () => {
        const storedUserData = localStorage.getItem('currentUserData');
        if (jwtToken && storedUserData) {
            currentUserData = JSON.parse(storedUserData);
        } else {
            localStorage.removeItem('jwtToken'); 
            jwtToken = null;
            currentUserData = null;
        }
        
        populateCurrencySelects();
        fetchAndDisplayRates();
        updateUIForAuthState();
    };

    initializeApp();
});