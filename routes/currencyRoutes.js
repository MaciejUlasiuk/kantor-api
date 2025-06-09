const express = require('express');
const router = express.Router();
const nbpService = require('../services/nbpService');
/**
 * @swagger
 * /api/rates:
 *   get:
 *     summary: Pobiera kursy walut.
 *     tags: [Currency]
 *     responses:
 *       200:
 *         description: Lista kursów.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Rate'
 */
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