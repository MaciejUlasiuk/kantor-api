const nbpService = require('../services/nbpService'); 
const { users } = require('./authController'); 


const exchangeCurrency = async (req, res) => {
    const userId = req.user.id;
    const { fromCurrency, toCurrency, amount } = req.body;

    console.log(`Użytkownik ${userId} próbuje wymienić ${amount} ${fromCurrency} na ${toCurrency}`);

    

    res.status(200).json({
        message: `Wymiana ${amount} ${fromCurrency} na ${toCurrency} - endpoint w budowie.`,
        userId: userId
    });
};

module.exports = {
    exchangeCurrency,
};