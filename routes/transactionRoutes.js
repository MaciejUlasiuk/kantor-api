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

/**
 * @swagger
 * /api/transactions/donate:
 *   post:
 *     summary: Przekazuje środki na cel charytatywny
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currency
 *               - amount
 *             properties:
 *               currency:
 *                 type: string
 *                 description: Kod waluty do przekazania.
 *                 example: "PLN"
 *               amount:
 *                 type: number
 *                 format: double
 *                 description: Kwota do przekazania.
 *                 example: 20.00
 *     responses:
 *       200:
 *         description: Środki pomyślnie przekazane.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 donation:
 *                   type: object # Można zdefiniować schemat Donation
 *                 updatedBalances:
 *                   $ref: '#/components/schemas/UserBalances'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/donate', protect, transactionController.donateFunds);
module.exports = router;