const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Zarządzanie uwierzytelnianiem użytkowników
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Rejestruje nowego użytkownika
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Użytkownik pomyślnie zarejestrowany
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *       400:
 *         description: Nieprawidłowe dane wejściowe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Użytkownik o podanym emailu już istnieje
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Błąd serwera
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', authController.registerUser);
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Loguje istniejącego użytkownika i zwraca token JWT
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Pomyślnie zalogowano, token JWT w odpowiedzi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Brakujące dane (email lub hasło)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Nieprawidłowy email lub hasło
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Błąd serwera
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', authController.loginUser);
/** @swagger
 * /api/auth/me:
 *   get: { summary: Pobiera dane zalogowanego użytkownika, tags: [Authentication], security: [{"bearerAuth": []}], responses: { 200: { description: Dane zalogowanego użytkownika, content: { "application/json": { schema: { type: object, properties: { id: {type: "integer"}, email: {type: "string", format: "email"}}}}}}, 401: { $ref: "#/components/responses/Unauthorized" }}}
 *   delete:
 *     summary: Usuwa konto zalogowanego użytkownika
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Konto pomyślnie usunięte
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Konto zostało pomyślnie usunięte."
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

router.get('/me', protect, (req, res) => {
    if (req.user) {
        res.status(200).json({
            id: req.user.id,
            email: req.user.email,
            
        });
    } else {
        res.status(401).json({ message: 'Nieautoryzowany dostęp.' });
    }
});
router.delete('/me', protect, authController.deleteAccount);
module.exports = router;