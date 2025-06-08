const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
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

module.exports = router;