document.addEventListener('DOMContentLoaded', () => {
    const ratesBody = document.getElementById('ratesBody');
    const loader = document.getElementById('loader');
    const errorMessageElement = document.getElementById('errorMessage');

    const API_URL = 'http://127.0.0.1:3000/api/rates'; 

    const displayError = (message) => {
        errorMessageElement.textContent = message;
        errorMessageElement.style.display = 'block';
        ratesBody.innerHTML = ''; 
    };

    const clearError = () => {
        errorMessageElement.textContent = '';
        errorMessageElement.style.display = 'none';
    };

    const fetchAndDisplayRates = async () => {
        loader.style.display = 'block'; 
        clearError(); 
        ratesBody.innerHTML = ''; 

        try {
            const response = await fetch(API_URL);

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { message: `Błąd serwera: ${response.status} ${response.statusText}` };
                }
                throw new Error(errorData.message || `HTTP error status: ${response.status}`);
            }

            const rates = await response.json();

            if (rates && rates.length > 0) {
                rates.forEach(rate => {
                    const rateRow = document.createElement('div');
                    rateRow.classList.add('rate-row');

                    const currencyDiv = document.createElement('div');
                    currencyDiv.classList.add('rate-currency');
                    currencyDiv.textContent = rate.currency;

                    const codeDiv = document.createElement('div');
                    codeDiv.classList.add('rate-code');
                    codeDiv.textContent = rate.code;

                    const midDiv = document.createElement('div');
                    midDiv.classList.add('rate-value');
                    midDiv.textContent = typeof rate.mid === 'number' ? rate.mid.toFixed(4) : 'N/A';

                    rateRow.appendChild(currencyDiv);
                    rateRow.appendChild(codeDiv);
                    rateRow.appendChild(midDiv);

                    ratesBody.appendChild(rateRow);
                });
            } else {
                displayError('Brak dostępnych kursów walut.');
            }

        } catch (error) {
            console.error('Błąd podczas pobierania kursów:', error);
            displayError(`Nie udało się załadować kursów: ${error.message}`);
        } finally {
            loader.style.display = 'none'; 
        }
    };

    fetchAndDisplayRates();

    
});