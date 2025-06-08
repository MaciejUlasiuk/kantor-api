document.addEventListener('DOMContentLoaded', () => {
    const ratesBody = document.getElementById('ratesBody');
    const ratesLoader = document.getElementById('loader'); 
    const ratesErrorMessageElement = document.getElementById('ratesErrorMessage');

    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const registerMessage = document.getElementById('registerMessage');
    const loginMessage = document.getElementById('loginMessage');
    const authFormsContainer = document.getElementById('authForms');
    const userInfoDiv = document.getElementById('userInfo');
    const userNameSpan = document.getElementById('userName');
    const logoutButton = document.getElementById('logoutButton');

    const protectedActionDiv = document.querySelector('.protected-action');
    const fetchProfileButton = document.getElementById('fetchProfileButton');
    const profileMessage = document.getElementById('profileMessage');


    const API_BASE_URL = 'http://127.0.0.1:3000'; 
    const NBP_API_URL = `${API_BASE_URL}/api/rates`;
    const AUTH_API_URL = `${API_BASE_URL}/api/auth`;

    let jwtToken = localStorage.getItem('jwtToken'); 

    const showMessage = (element, message, isSuccess = true) => {
        element.textContent = message;
        element.className = 'message ' + (isSuccess ? 'success' : 'error');
    };
    const clearMessage = (element) => {
        element.textContent = '';
        element.className = 'message';
    };

    const updateUIForAuthState = () => {
        if (jwtToken) {
            authFormsContainer.style.display = 'none';
            userInfoDiv.style.display = 'block';
            protectedActionDiv.style.display = 'block'; 
            const userEmail = localStorage.getItem('userEmail') || 'Użytkownik';
            userNameSpan.textContent = userEmail.split('@')[0];
        } else {
            authFormsContainer.style.display = 'flex'; 
            userInfoDiv.style.display = 'none';
            protectedActionDiv.style.display = 'none'; 
            userNameSpan.textContent = '';
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
                if (!response.ok) {
                    throw new Error(data.message || `Błąd rejestracji: ${response.status}`);
                }
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
                if (!response.ok) {
                    throw new Error(data.message || `Błąd logowania: ${response.status}`);
                }
                
                jwtToken = data.token;
                localStorage.setItem('jwtToken', jwtToken);
                localStorage.setItem('userEmail', data.user?.email || email); 
                
                showMessage(loginMessage, data.message || 'Zalogowano pomyślnie!', true);
                loginForm.reset();
                updateUIForAuthState(); 
            } catch (error) {
                console.error('Błąd logowania:', error);
                showMessage(loginMessage, error.message, false);
                localStorage.removeItem('jwtToken');
                localStorage.removeItem('userEmail');
                jwtToken = null;
                updateUIForAuthState();
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('userEmail');
            jwtToken = null;
            updateUIForAuthState();
            clearMessage(loginMessage); 
            clearMessage(profileMessage);
        });
    }

    if (fetchProfileButton) {
        fetchProfileButton.addEventListener('click', async () => {
            clearMessage(profileMessage);
            if (!jwtToken) {
                showMessage(profileMessage, 'Musisz być zalogowany, aby zobaczyć profil.', false);
                return;
            }

            try {
                const response = await fetch(`${AUTH_API_URL}/me`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${jwtToken}`
                    }
                });
                const data = await response.json();
                if (!response.ok) {
                    if (response.status === 401) {
                        localStorage.removeItem('jwtToken');
                        localStorage.removeItem('userEmail');
                        jwtToken = null;
                        updateUIForAuthState();
                        showMessage(profileMessage, data.message || 'Sesja wygasła. Zaloguj się ponownie.', false);
                        return;
                    }
                    throw new Error(data.message || `Błąd pobierania profilu: ${response.status}`);
                }
                showMessage(profileMessage, `Profil: ID=${data.id}, Email=${data.email}`, true);
            } catch (error) {
                console.error('Błąd pobierania profilu:', error);
                showMessage(profileMessage, error.message, false);
            }
        });
    }


    fetchAndDisplayRates(); 
    updateUIForAuthState(); 
});