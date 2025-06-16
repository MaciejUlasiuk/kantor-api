const nbpService = require('../services/nbpService');
const { users } = require('./authController');

const exchangeCurrency = async (req, res, next) => {
    const userId = req.user.id;
    const { fromCurrency, toCurrency, amount } = req.body;
    if (!fromCurrency || !toCurrency || amount === undefined) return res.status(400).json({ message: 'Pola fromCurrency, toCurrency oraz amount są wymagane.' });
    if (typeof amount !== 'number' || amount <= 0) return res.status(400).json({ message: 'Kwota (amount) musi być liczbą większą od zera.' });
    if (fromCurrency === toCurrency) return res.status(400).json({ message: 'Waluta początkowa i docelowa nie mogą być takie same.' });

    try {
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) { const error = new Error('Nie znaleziono użytkownika.'); error.statusCode = 404; throw error; }
        const user = users[userIndex];
        let nbpRates;
        try { nbpRates = await nbpService.fetchExchangeRates(); }
        catch (nbpError) { return res.status(503).json({ message: `Nie można pobrać kursów z NBP: ${nbpError.message}` }); }

        let rateFrom = 1.0, rateTo = 1.0;
        if (fromCurrency !== 'PLN') {
            const foundRateFrom = nbpRates.find(r => r.code === fromCurrency);
            if (!foundRateFrom) return res.status(400).json({ message: `Nie znaleziono kursu dla ${fromCurrency}.` });
            rateFrom = foundRateFrom.mid;
        }
        if (toCurrency !== 'PLN') {
            const foundRateTo = nbpRates.find(r => r.code === toCurrency);
            if (!foundRateTo) return res.status(400).json({ message: `Nie znaleziono kursu dla ${toCurrency}.` });
            rateTo = foundRateTo.mid;
        }

        if (user.balances[fromCurrency] === undefined) user.balances[fromCurrency] = 0;
        if (user.balances[toCurrency] === undefined) user.balances[toCurrency] = 0;
        if (user.balances[fromCurrency] < amount) return res.status(400).json({ message: `Niewystarczające środki. Masz ${user.balances[fromCurrency].toFixed(2)} ${fromCurrency}.` });

        const amountInPLN = fromCurrency === 'PLN' ? amount : amount * rateFrom;
        const exchangedAmount = toCurrency === 'PLN' ? amountInPLN : amountInPLN / rateTo;

        user.balances[fromCurrency] = parseFloat((user.balances[fromCurrency] - amount).toFixed(2));
        user.balances[toCurrency] = parseFloat((user.balances[toCurrency] + exchangedAmount).toFixed(2));

        const transactionRecord = {
            id: user.transactions.length + 1, date: new Date().toISOString(),
            fromCurrency, amountSold: parseFloat(amount.toFixed(2)),
            toCurrency, amountReceived: parseFloat(exchangedAmount.toFixed(2)),
            rateUsed: { fromPLN: fromCurrency === 'PLN' ? 1 : rateFrom, toPLN: toCurrency === 'PLN' ? 1 : rateTo }
        };
        user.transactions.push(transactionRecord);
        users[userIndex] = user;

        res.status(200).json({ message: 'Wymiana zakończona pomyślnie.', transaction: transactionRecord, updatedBalances: user.balances });
    } catch (error) { next(error); }
};

const donateFunds = async (req, res, next) => {
    const userId = req.user.id;
    const { currency, amount } = req.body;

    if (!currency || amount === undefined) {
        return res.status(400).json({ message: 'Pola currency oraz amount są wymagane.' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: 'Kwota (amount) musi być liczbą większą od zera.' });
    }

    try {
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            const error = new Error('Nie znaleziono użytkownika.');
            error.statusCode = 404;
            throw error;
        }
        const user = users[userIndex];

        if (user.balances[currency] === undefined || user.balances[currency] < amount) {
            return res.status(400).json({ message: `Niewystarczające środki. Masz ${user.balances[currency] !== undefined ? user.balances[currency].toFixed(2) : '0.00'} ${currency}.` });
        }

        user.balances[currency] = parseFloat((user.balances[currency] - amount).toFixed(2));
        
        const donationRecord = {
            id: `donation-${user.transactions.length + 1}`, 
            type: 'donation',
            date: new Date().toISOString(),
            currency,
            amountDonated: parseFloat(amount.toFixed(2)),
            charityTarget: "Wybrana Fundacja Charytatywna (Symulacja)" 
        };
        user.transactions.push(donationRecord); 
        users[userIndex] = user;

        console.log(`Użytkownik ${userId} przekazał ${amount.toFixed(2)} ${currency} na cele charytatywne.`);

        res.status(200).json({
            message: `Dziękujemy! ${amount.toFixed(2)} ${currency} zostało przekazane na cele charytatywne.`,
            donation: donationRecord,
            updatedBalances: user.balances
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { exchangeCurrency, donateFunds };