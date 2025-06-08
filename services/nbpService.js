const axios = require('axios');

const NBP_API_URL_TABLE_A = 'http://api.nbp.pl/api/exchangerates/tables/A/?format=json';
const REST_COUNTRIES_API_URL_BY_CURRENCY = 'https://restcountries.com/v3.1/currency/';

const fetchExchangeRates = async () => {
    try {
        console.log('NBPService: Próba pobrania kursów z NBP API...');
        const nbpResponse = await axios.get(NBP_API_URL_TABLE_A);

        if (nbpResponse.data && Array.isArray(nbpResponse.data) && nbpResponse.data.length > 0 && nbpResponse.data[0].rates) {
            console.log('NBPService: Pomyślnie pobrano kursy z NBP.');
            const ratesWithFlags = [];
            const nbpRates = nbpResponse.data[0].rates;

            for (const rate of nbpRates) {
                let flagUrl = null;
                if (rate.code.length === 3 && rate.code !== 'XDR') { 
                    try {
                        console.log(`NBPService: Próba pobrania flagi dla ${rate.code} z REST Countries...`);
                        const countryResponse = await axios.get(`${REST_COUNTRIES_API_URL_BY_CURRENCY}${rate.code}`);
                        if (countryResponse.data && countryResponse.data.length > 0) {
                            flagUrl = countryResponse.data[0].flags?.svg || countryResponse.data[0].flags?.png || null;
                            if (flagUrl) {
                                console.log(`NBPService: Znaleziono flagę dla ${rate.code}`);
                            } else {
                                console.log(`NBPService: Brak URL flagi w odpowiedzi dla ${rate.code}`);
                            }
                        }
                    } catch (countryError) {
                        console.warn(`NBPService: Nie udało się pobrać flagi dla ${rate.code} z REST Countries. Błąd: ${countryError.response?.status || countryError.message}`);
                    }
                }

                ratesWithFlags.push({
                    ...rate, 
                    flagUrl: flagUrl 
                });
            }
            console.log('NBPService: Zakończono wzbogacanie kursów o flagi.');
            return ratesWithFlags;

        } else {
            console.error('NBPService: Otrzymano nieoczekiwany format danych z NBP API.');
            throw new Error('Nieoczekiwany format danych z NBP API. Problem z przetwarzaniem odpowiedzi.');
        }
    } catch (error) {
        console.error('NBPService: Błąd podczas komunikacji z NBP API lub ogólny błąd w fetchExchangeRates:', error.message);
         let serviceError;
         if (error.response) {
             const status = error.response.status;
             const nbpErrorMessage = error.response.data?.message || (typeof error.response.data === 'string' ? error.response.data : 'Błąd NBP API');
             let customMessage = `Błąd po stronie NBP API (status: ${status}). Oryginalna wiadomość: ${nbpErrorMessage}`;
             if (status === 404) customMessage = 'Nie znaleziono danych o kursach walut w NBP.';
             else if (status === 400) customMessage = 'Nieprawidłowe zapytanie do API NBP.';
             else if (status >= 500) customMessage = 'Wewnętrzny błąd serwera NBP.';
             
             serviceError = new Error(customMessage);
             serviceError.statusCode = status;
         } else if (error.request) {
             serviceError = new Error('Nie można połączyć się z serwisem NBP.');
             serviceError.statusCode = 503;
         } else { 
             serviceError = new Error(error.message || 'Wystąpił wewnętrzny błąd podczas próby komunikacji z NBP API.');
             serviceError.statusCode = error.statusCode || 500;
         }
         throw serviceError;
    }
};

module.exports = {
    fetchExchangeRates,
};