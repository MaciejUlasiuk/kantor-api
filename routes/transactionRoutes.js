const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware'); 

router.post('/exchange', protect, transactionController.exchangeCurrency);

module.exports = router;