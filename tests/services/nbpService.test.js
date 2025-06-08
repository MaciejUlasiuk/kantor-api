const axios = require('axios');
const nbpService = require('../../services/nbpService'); 
jest.mock('axios');

describe('NBP Service - fetchExchangeRates', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch exchange rates from NBP and enrich with flags from REST Countries successfully', async () => {
    const mockNbpResponse = {
      data: [
        {
          table: 'A',
          no: '100/A/NBP/2023',
          effectiveDate: '2023-05-24',
          rates: [
            { currency: 'dolar amerykański', code: 'USD', mid: 4.00 },
            { currency: 'euro', code: 'EUR', mid: 4.30 },
          ],
        },
      ],
    };

    const mockUsdCountryResponse = {
      data: [
        { flags: { svg: 'https://flagcdn.com/us.svg' } },
      ],
    };

    const mockEurCountryResponse = {
      data: [
        { flags: { png: 'https://flagcdn.com/eu.png' } }, 
      ],
    };

    axios.get.mockResolvedValueOnce(mockNbpResponse);
    axios.get.mockResolvedValueOnce(mockUsdCountryResponse);
    axios.get.mockResolvedValueOnce(mockEurCountryResponse);

    const rates = await nbpService.fetchExchangeRates();

    expect(axios.get).toHaveBeenCalledTimes(3);
    expect(axios.get).toHaveBeenNthCalledWith(1, 'http://api.nbp.pl/api/exchangerates/tables/A/?format=json');
    expect(axios.get).toHaveBeenNthCalledWith(2, 'https://restcountries.com/v3.1/currency/USD');
    expect(axios.get).toHaveBeenNthCalledWith(3, 'https://restcountries.com/v3.1/currency/EUR');

    expect(rates).toBeInstanceOf(Array);
    expect(rates.length).toBe(2);

    expect(rates[0]).toEqual({
      currency: 'dolar amerykański',
      code: 'USD',
      mid: 4.00,
      flagUrl: 'https://flagcdn.com/us.svg',
    });
    expect(rates[1]).toEqual({
      currency: 'euro',
      code: 'EUR',
      mid: 4.30,
      flagUrl: 'https://flagcdn.com/eu.png',
    });
  });

  it('should handle NBP API error gracefully', async () => {
    axios.get.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 500, data: { message: 'NBP Internal Server Error' } },
      message: 'Request failed with status code 500'
    });

    await expect(nbpService.fetchExchangeRates()).rejects.toThrow(
      'Wewnętrzny błąd serwera NBP.'
    );

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith('http://api.nbp.pl/api/exchangerates/tables/A/?format=json');
  });

  it('should handle REST Countries API error gracefully (e.g., 404 for a currency)', async () => {
    const mockNbpResponse = {
      data: [{ rates: [{ currency: 'waluta testowa', code: 'XXX', mid: 1.00 }] }],
    };
    axios.get.mockResolvedValueOnce(mockNbpResponse);
    axios.get.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 404, data: { message: 'Not Found' } },
      message: 'Request failed with status code 404'
    });

    const rates = await nbpService.fetchExchangeRates();

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenNthCalledWith(1, 'http://api.nbp.pl/api/exchangerates/tables/A/?format=json');
    expect(axios.get).toHaveBeenNthCalledWith(2, 'https://restcountries.com/v3.1/currency/XXX');

    expect(rates.length).toBe(1);
    expect(rates[0]).toEqual({
      currency: 'waluta testowa',
      code: 'XXX',
      mid: 1.00,
      flagUrl: null,
    });
  
  });

  it('should handle unexpected NBP API response format', async () => {
    axios.get.mockResolvedValueOnce({ data: { unexpected: 'format' } }); 

    await expect(nbpService.fetchExchangeRates()).rejects.toThrow(
      'Nieoczekiwany format danych z NBP API. Problem z przetwarzaniem odpowiedzi.'
    );
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

   it('should handle cases where flag URL is not present in REST Countries response', async () => {
     const mockNbpResponse = {
       data: [{ rates: [{ currency: 'Bitcoin', code: 'BTC', mid: 100000.00 }] }],
     };
     const mockBtcCountryResponseNoFlag = { 
       data: [{ name: { common: 'Bitcoin' }, flags: { alt: 'No flag' } }]
     };

     axios.get.mockResolvedValueOnce(mockNbpResponse);
     axios.get.mockResolvedValueOnce(mockBtcCountryResponseNoFlag);

     const rates = await nbpService.fetchExchangeRates();

     expect(axios.get).toHaveBeenCalledTimes(2);
     expect(rates[0].flagUrl).toBeNull();
   });

   it('should filter out non-3-letter codes and XDR before calling REST Countries', async () => {
     const mockNbpResponse = {
         data: [{
             rates: [
                 { currency: 'SDR (MFW)', code: 'XDR', mid: 5.00 },
                 { currency: 'Dolar', code: 'USD', mid: 4.00 },
                 { currency: 'Złoto uncja', code: 'GOLD', mid: 8000.00 }, 
             ]
         }]
     };
     const mockUsdCountryResponse = {
         data: [{ flags: { svg: 'https://flagcdn.com/us.svg' } }],
     };

     axios.get.mockResolvedValueOnce(mockNbpResponse);
     axios.get.mockResolvedValueOnce(mockUsdCountryResponse); 

     const rates = await nbpService.fetchExchangeRates();

     
     expect(axios.get).toHaveBeenCalledTimes(2);
     expect(axios.get).toHaveBeenNthCalledWith(1, 'http://api.nbp.pl/api/exchangerates/tables/A/?format=json');
     expect(axios.get).toHaveBeenNthCalledWith(2, 'https://restcountries.com/v3.1/currency/USD');
     
     expect(rates.length).toBe(3);
     expect(rates.find(r => r.code === 'XDR').flagUrl).toBeNull();
     expect(rates.find(r => r.code === 'USD').flagUrl).toBe('https://flagcdn.com/us.svg');
     expect(rates.find(r => r.code === 'GOLD').flagUrl).toBeNull();
 });

});