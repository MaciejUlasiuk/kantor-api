const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware'); 
/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Zarządzanie transakcjami wymiany walut
 */

/**
 * @swagger
 * /api/transactions/exchange:
 *   post:
 *     summary: Dokonuje wymiany walut dla zalogowanego użytkownika
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransactionInput'
 *     responses:
 *       200:
 *         description: Wymiana przetworzona pomyślnie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExchangeResponse'
 *       400:
 *         description: Błąd przetwarzania transakcji (np. nieprawidłowe dane, niewystarczające środki)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Nieautoryzowany dostęp
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Błąd serwera (np. problem z pobraniem kursów NBP)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       503:
 *         description: Serwis NBP niedostępny
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/exchange', protect, transactionController.exchangeCurrency);

module.exports = router;