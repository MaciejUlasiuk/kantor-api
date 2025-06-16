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
    const deleteAccountButton = document.getElementById('deleteAccountButton');
    const deleteAccountMessage = document.getElementById('deleteAccountMessage');

    const donationAmountInput = document.getElementById('donationAmount');
    const donationCurrencySelect = document.getElementById('donationCurrency');
    const donateButton = document.getElementById('donateButton');
    const donationMessage = document.getElementById('donationMessage');

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

    const API_BASE_URL = '';
    const NBP_API_URL = `${API_BASE_URL}/api/rates`;
    const AUTH_API_URL = `${API_BASE_URL}/api/auth`;
    const TRANSACTIONS_API_URL = `${API_BASE_URL}/api/transactions`;

    let jwtToken = localStorage.getItem('jwtToken');
    let currentUserData = null;
    let availableCurrenciesForUser = [];

    const showMessage = (element, message, isSuccess = true) => {
        element.textContent = message;
        element.className = 'message ' + (isSuccess ? 'success' : 'error');
    };
    const clearMessage = (element) => {
        element.textContent = '';
        element.className = 'message';
    };

    const populateUserCurrencySelects = () => {
        fromCurrencySelect.innerHTML = '';
        toCurrencySelect.innerHTML = '';
        donationCurrencySelect.innerHTML = '';

        if (currentUserData && currentUserData.balances) {
            
            const userBalanceCurrencies = Object.keys(currentUserData.balances);
            const nbpCurrencies = availableCurrenciesForUser; 
            
            let currenciesToUse = [...new Set([...userBalanceCurrencies, ...nbpCurrencies])].sort();
            if (currenciesToUse.length === 0) { 
                currenciesToUse = ['PLN', 'USD', 'EUR', 'GBP', 'CHF'].sort();
            }


            currenciesToUse.forEach(currency => {
                const optionFrom = document.createElement('option');
                optionFrom.value = currency;
                optionFrom.textContent = currency;
                fromCurrencySelect.appendChild(optionFrom);

                const optionTo = document.createElement('option');
                optionTo.value = currency;
                optionTo.textContent = currency;
                toCurrencySelect.appendChild(optionTo);

                const optionDonate = document.createElement('option');
                optionDonate.value = currency;
                optionDonate.textContent = currency;
                donationCurrencySelect.appendChild(optionDonate);
            });

            if (currenciesToUse.length > 1) {
                fromCurrencySelect.value = currenciesToUse.includes('PLN') ? 'PLN' : currenciesToUse[0];
                
                const defaultTo = currenciesToUse.find(c => c !== fromCurrencySelect.value) || currenciesToUse[1 % currenciesToUse.length] || currenciesToUse[0];
                toCurrencySelect.value = defaultTo;
                donationCurrencySelect.value = currenciesToUse.includes('PLN') ? 'PLN' : currenciesToUse[0];
            } else if (currenciesToUse.length === 1) {
                fromCurrencySelect.value = currenciesToUse[0];
                toCurrencySelect.value = currenciesToUse[0];
                donationCurrencySelect.value = currenciesToUse[0];
            }
        } else {
            const defaultCurrencies = ['PLN', 'USD', 'EUR', 'GBP', 'CHF'].sort();
             defaultCurrencies.forEach(currency => {
                const optionFrom = document.createElement('option'); optionFrom.value = currency; optionFrom.textContent = currency; fromCurrencySelect.appendChild(optionFrom);
                const optionTo = document.createElement('option'); optionTo.value = currency; optionTo.textContent = currency; toCurrencySelect.appendChild(optionTo);
                const optionDonate = document.createElement('option'); optionDonate.value = currency; optionDonate.textContent = currency; donationCurrencySelect.appendChild(optionDonate);
            });
            if (defaultCurrencies.length > 1) {
                fromCurrencySelect.value = 'PLN';
                toCurrencySelect.value = 'USD';
                donationCurrencySelect.value = 'PLN';
            }
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
                let details;
                let thirdColumn = '-';

                if (tx.type === 'donation') {
                    details = `Przekazano: ${tx.amountDonated.toFixed(2)} ${tx.currency}`;
                    thirdColumn = tx.charityTarget || 'Cel charytatywny';
                } else { 
                    details = `Sprzedano: ${tx.amountSold.toFixed(2)} ${tx.fromCurrency} | Otrzymano: ${tx.amountReceived.toFixed(2)} ${tx.toCurrency}`;
                    if (tx.rateUsed) {
                        let rateInfoParts = [];
                        if (tx.fromCurrency !== 'PLN' && tx.rateUsed.fromPLN) {
                            rateInfoParts.push(`${tx.fromCurrency}/PLN: ${tx.rateUsed.fromPLN.toFixed(4)}`);
                        }
                        if (tx.toCurrency !== 'PLN' && tx.rateUsed.toPLN) {
                            rateInfoParts.push(`${tx.toCurrency}/PLN: ${tx.rateUsed.toPLN.toFixed(4)}`);
                        }
                        if(tx.fromCurrency === 'PLN' && tx.toCurrency !== 'PLN' && tx.rateUsed.toPLN) {
                             rateInfoParts.push(`PLN/${tx.toCurrency}: ${(1 / tx.rateUsed.toPLN).toFixed(4)}`);
                        } else if (tx.toCurrency === 'PLN' && tx.fromCurrency !== 'PLN' && tx.rateUsed.fromPLN) {
                             rateInfoParts.push(`${tx.fromCurrency}/PLN: ${tx.rateUsed.fromPLN.toFixed(4)}`);
                        }

                        thirdColumn = rateInfoParts.join('; ') || '-';
                    }
                }
                listItem.innerHTML = `<div class="transaction-row"><div>${date}</div><div>${details}</div><div>${thirdColumn}</div></div>`;
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
            populateUserCurrencySelects(); 
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
                const errorData = await response.json().catch(() => ({ message: `Błąd serwera NBP lub REST Countries: ${response.status}` }));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const rates = await response.json();
            if (rates && rates.length > 0) {
                const nbpCurrencyCodes = ['PLN', ...rates.map(r => r.code)];
                let baseCurrencies = [...new Set(nbpCurrencyCodes.filter(code => code && code.length === 3 && code !== 'XDR'))].sort();
                
                if(currentUserData && currentUserData.balances) {
                     baseCurrencies = [...new Set([...baseCurrencies, ...Object.keys(currentUserData.balances)])].sort();
                }
                availableCurrenciesForUser = baseCurrencies; 

                rates.forEach(rate => {
                    const rateRow = document.createElement('div');
                    rateRow.classList.add('rate-row');
                    const flagDiv = document.createElement('div');
                    flagDiv.classList.add('rate-flag');
                    if (rate.flagUrl) {
                        const img = document.createElement('img');
                        img.src = rate.flagUrl;
                        img.alt = `Flaga dla ${rate.code}`;
                        img.onerror = () => { img.style.display = 'none'; };
                        flagDiv.appendChild(img);
                    } else {
                        flagDiv.textContent = '-';
                    }
                    const currencyDiv = document.createElement('div');
                    currencyDiv.classList.add('rate-currency');
                    currencyDiv.textContent = rate.currency;
                    const codeDiv = document.createElement('div');
                    codeDiv.classList.add('rate-code');
                    codeDiv.textContent = rate.code;
                    const midDiv = document.createElement('div');
                    midDiv.classList.add('rate-value');
                    midDiv.textContent = typeof rate.mid === 'number' ? rate.mid.toFixed(4) : 'N/A';
                    rateRow.appendChild(flagDiv);
                    rateRow.appendChild(currencyDiv);
                    rateRow.appendChild(codeDiv);
                    rateRow.appendChild(midDiv);
                    ratesBody.appendChild(rateRow);
                });
            } else {
                displayRatesError('Brak dostępnych kursów walut.');
            }
        } catch (error) {
            console.error('Błąd podczas pobierania kursów NBP/flag:', error);
            displayRatesError(`Nie udało się załadować kursów: ${error.message}`);
        } finally {
            ratesLoader.style.display = 'none';
            if (jwtToken && currentUserData) { 
                 populateUserCurrencySelects();
            } else if (!jwtToken) { 
                 populateUserCurrencySelects();
            }
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
            return await response.json();
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
        clearMessage(donationMessage);
        clearMessage(deleteAccountMessage);
        populateUserCurrencySelects(); 
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
                
                if (data.token && data.user) {
                    showMessage(registerMessage, `Rejestracja pomyślna dla ${data.user.email}. Zostałeś automatycznie zalogowany.`, true);
                    registerForm.reset();
                    handleLoginSuccess(data); 
                } else {
                    showMessage(registerMessage, data.message || 'Rejestracja pomyślna! Możesz się teraz zalogować.', true);
                    registerForm.reset();
                }
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
                if (!response.ok) 
                    {
                        showMessage(loginMessage, 'Błędny login lub hasło', false);
                        throw new Error(data.message || `Błąd logowania: ${response.status}`);
                    }
                handleLoginSuccess(data);
            } catch (error) {
                showMessage(loginMessage, 'Błędny login lub hasło', false);
                console.error('Błąd logowania:', error);
                handleLogout();
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    if (deleteAccountButton) {
        deleteAccountButton.addEventListener('click', async () => {
            clearMessage(deleteAccountMessage);
            if (!jwtToken) {
                showMessage(deleteAccountMessage, 'Musisz być zalogowany.', false);
                return;
            }
            if (confirm('Czy na pewno chcesz usunąć swoje konto? Tej operacji nie można cofnąć.')) {
                try {
                    const response = await fetch(`${AUTH_API_URL}/me`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${jwtToken}` }
                    });
                    const data = await response.json();
                    if (!response.ok) {
                        if (response.status === 401) handleLogout();
                        throw new Error(data.message || `Błąd usuwania konta: ${response.status}`);
                    }
                    showMessage(deleteAccountMessage, data.message || 'Konto usunięte.', true);
                    handleLogout();
                } catch (error) {
                    console.error('Błąd usuwania konta:', error);
                    showMessage(deleteAccountMessage, error.message, false);
                }
            }
        });
    }

    if (donateButton) {
        donateButton.addEventListener('click', async () => {
            clearMessage(donationMessage);
            if (!jwtToken || !currentUserData) {
                showMessage(donationMessage, 'Musisz być zalogowany.', false);
                return;
            }
            const amount = parseFloat(donationAmountInput.value);
            const currency = donationCurrencySelect.value;

            if (isNaN(amount) || amount <= 0) {
                showMessage(donationMessage, 'Podaj poprawną kwotę darowizny.', false);
                return;
            }
            if (!currency) {
                showMessage(donationMessage, 'Wybierz walutę darowizny.', false);
                return;
            }

            try {
                const response = await fetch(`${TRANSACTIONS_API_URL}/donate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
                    body: JSON.stringify({ currency, amount })
                });
                const data = await response.json();
                if (!response.ok) {
                    if (response.status === 401) handleLogout();
                    throw new Error(data.message || `Błąd darowizny: ${response.status}`);
                }
                showMessage(donationMessage, data.message || 'Darowizna przekazana!', true);
                
                currentUserData.balances = data.updatedBalances;
                if (!currentUserData.transactions) currentUserData.transactions = [];
                currentUserData.transactions.push(data.donation);
                localStorage.setItem('currentUserData', JSON.stringify(currentUserData));

                displayUserBalances();
                displayTransactionHistory();
                donationAmountInput.value = ''; 
            } catch (error) {
                console.error('Błąd darowizny:', error);
                showMessage(donationMessage, error.message, false);
            }
        });
    }


    if (exchangeForm) {
        exchangeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearMessage(exchangeMessage);
            if (!jwtToken || !currentUserData) {
                showMessage(exchangeMessage, 'Musisz być zalogowany.', false);
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
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
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
                populateUserCurrencySelects(); 
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
            localStorage.removeItem('currentUserData');
            jwtToken = null;
            currentUserData = null;
        }
        
        fetchAndDisplayRates();
        updateUIForAuthState(); 
    };

    initializeApp();
});