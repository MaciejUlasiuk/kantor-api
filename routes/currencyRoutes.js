const express = require('express');
const router = express.Router();
const nbpService = require('../services/nbpService');

router.get('/rates', async (req, res) => {
  try {
    const rates = await nbpService.fetchExchangeRates();
    res.json(rates);
  } catch (error) {
    console.error('Błąd podczas pobierania kursów walut:', error);
    res.status(500).json({ message: 'Nie udało się pobrać kursów walut.' });
  }
});

module.exports = router;