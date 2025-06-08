const nbpService = require('../services/nbpService');
const { users } = require('./authController'); 

const exchangeCurrency = async (req, res) => {
    const userId = req.user.id; 
    const { fromCurrency, toCurrency, amount } = req.body;

    if (!fromCurrency || !toCurrency || amount === undefined) {
        return res.status(400).json({ message: 'Pola fromCurrency, toCurrency oraz amount są wymagane.' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: 'Kwota (amount) musi być liczbą większą od zera.' });
    }
    if (fromCurrency === toCurrency) {
        return res.status(400).json({ message: 'Waluta początkowa i docelowa nie mogą być takie same.' });
    }
    try {
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            console.error(`exchangeCurrency: Użytkownik o ID ${userId} nie został znaleziony, mimo przejścia przez 'protect'.`);
            return res.status(404).json({ message: 'Nie znaleziono użytkownika.' });
        }
        const user = users[userIndex];

        let nbpRates;
        try {
            nbpRates = await nbpService.fetchExchangeRates();
        } catch (nbpError) {
            console.error('Błąd pobierania kursów z NBP podczas wymiany:', nbpError);
            return res.status(503).json({ message: `Nie można pobrać aktualnych kursów walut z NBP: ${nbpError.message}` });
        }


        let rateFrom = 1.0; 
        let rateTo = 1.0;   

        if (fromCurrency !== 'PLN') {
            const foundRateFrom = nbpRates.find(r => r.code === fromCurrency);
            if (!foundRateFrom) {
                return res.status(400).json({ message: `Nie znaleziono kursu dla waluty ${fromCurrency} w NBP.` });
            }
            rateFrom = foundRateFrom.mid; 
        }

        if (toCurrency !== 'PLN') {
            const foundRateTo = nbpRates.find(r => r.code === toCurrency);
            if (!foundRateTo) {
                return res.status(400).json({ message: `Nie znaleziono kursu dla waluty ${toCurrency} w NBP.` });
            }
            rateTo = foundRateTo.mid; 
        }

        if (user.balances[fromCurrency] === undefined) user.balances[fromCurrency] = 0;
        if (user.balances[toCurrency] === undefined) user.balances[toCurrency] = 0;

        if (user.balances[fromCurrency] < amount) {
            return res.status(400).json({
                message: `Niewystarczające środki. Masz ${user.balances[fromCurrency].toFixed(2)} ${fromCurrency}, a próbujesz wymienić ${amount.toFixed(2)} ${fromCurrency}.`
            });
        }

        const amountInPLN = fromCurrency === 'PLN' ? amount : amount * rateFrom;
        const exchangedAmount = toCurrency === 'PLN' ? amountInPLN : amountInPLN / rateTo;

        user.balances[fromCurrency] = parseFloat((user.balances[fromCurrency] - amount).toFixed(2));
        user.balances[toCurrency] = parseFloat((user.balances[toCurrency] + exchangedAmount).toFixed(2));

        const transactionRecord = {
            id: user.transactions.length + 1,
            date: new Date().toISOString(),
            fromCurrency,
            amountSold: parseFloat(amount.toFixed(2)),
            toCurrency,
            amountReceived: parseFloat(exchangedAmount.toFixed(2)),
            rateUsed: { 
                fromPLN: fromCurrency === 'PLN' ? 1 : rateFrom,
                toPLN: toCurrency === 'PLN' ? 1 : rateTo,
            }
        };
        user.transactions.push(transactionRecord);

        users[userIndex] = user;

        console.log(`Użytkownik ${userId} wymienił ${amount} ${fromCurrency} na ${exchangedAmount.toFixed(2)} ${toCurrency}. Nowe salda:`, user.balances);

        res.status(200).json({
            message: 'Wymiana zakończona pomyślnie.',
            transaction: transactionRecord,
            updatedBalances: user.balances
        });

    } catch (error) {
        console.error(`Błąd podczas wymiany walut dla użytkownika ${userId}:`, error);
        res.status(500).json({ message: 'Wystąpił wewnętrzny błąd serwera podczas przetwarzania wymiany.' });
    }
};

module.exports = {
    exchangeCurrency,
};