const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = {
                id: decoded.id,
                email: decoded.email
            };

            next(); 
        } catch (error) {
            console.error('Błąd weryfikacji tokenu:', error.message);
            let message = 'Nieautoryzowany dostęp. Token nieprawidłowy lub wygasł.';
            if (error.name === 'TokenExpiredError') {
                message = 'Sesja wygasła. Zaloguj się ponownie.';
            }
            res.status(401).json({ message });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Nieautoryzowany dostęp. Brak tokenu.' });
    }
};



module.exports = {
    protect,
};
