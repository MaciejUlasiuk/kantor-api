const axios = require('axios');

const NBP_API_URL_TABLE_A = 'http://api.nbp.pl/api/exchangerates/tables/A/?format=json';


const fetchExchangeRates = async () => {
  try {
    console.log('Próba pobrania kursów z NBP API...');
    const response = await axios.get(NBP_API_URL_TABLE_A);

    if (response.data && response.data.length > 0 && response.data[0].rates) {
      console.log('Pomyślnie pobranoo kursy.');
      return response.data[0].rates;
    } else {
      console.error('Otrzymano nieoczekiwany format danych z NBP API.');
      throw new Error('Nieoczekiwany format danych z NBP API.');
    }
  } catch (error) {
    console.error('Błąd podczas komunikacji z NBP API:', error.message);
    if (error.response) {
      console.error('Status błędu od NBP:', error.response.status);
      console.error('Dane błędu od NBP:', error.response.data);
      throw new Error(`Błąd NBP API: ${error.response.status} - ${error.response.data.message || 'Nieznany błąd NBP'}`);
    } else if (error.request) {
      console.error('Brak odpowiedzi z serwera NBP.');
      throw new Error('Brak odpowiedzi z serwera NBP. Sprawdź połączenie internetowe lub status API NBP.');
    } else {
      console.error('Błąd konfiguracji żądania Axios:', error.message);
      throw new Error('Błąd konfiguracji żądania do NBP API.');
    }
  }
};

module.exports = {
  fetchExchangeRates,
};