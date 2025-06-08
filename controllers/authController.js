const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const users = []; 

const generateToken = (id, email) => {
    if (!process.env.JWT_SECRET) {
        console.error("JWT is not defined.");
        throw new Error("JWT is not defined..");
    }
    return jwt.sign(
        { id, email }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } 
    );
};


const registerUser = async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email i hasło są wymagane.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Nieprawidłowy format adresu email.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Hasło musi mieć co najmniej 6 znaków.' });
    }

    try {
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(409).json({ message: 'Użytkownik o podanym adresie email już istnieje.' });
        }

        const salt = await bcrypt.genSalt(10); 
        const hashedPassword = await bcrypt.hash(password, salt); 

        const newUser = {
            id: users.length > 0 ? users[users.length - 1].id + 1 : 1, 
            name: name || email.split('@')[0], 
            email: email,
            password: hashedPassword, 
            createdAt: new Date().toISOString(),
            balances: {
                PLN: 1000.00, 
                USD: 0.00,
                EUR: 0.00,
                CHF: 0.00,
            },
            transactions: [] 
        };

        users.push(newUser);
        console.log('Zarejestrowano nowego użytkownika:', newUser.email, 'z saldami:', newUser.balances);
        
        res.status(201).json({
            message: 'Użytkownik zarejestrowany pomyślnie.',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                createdAt: newUser.createdAt,
                balances: newUser.balances 
            }
        });

    } catch (error) {
        console.error('Błąd podczas rejestracji użytkownika:', error);
        res.status(500).json({ message: 'Wystąpił błąd serwera podczas rejestracji.' });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email i hasło są wymagane.' });
    }

    try {
        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(401).json({ message: 'Nieprawidłowy email lub hasło.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Nieprawidłowy email lub hasło.' });
        }

        const token = generateToken(user.id, user.email);

        res.status(200).json({
            message: 'Zalogowano pomyślnie.',
            token: token,
            user: { 
                id: user.id,
                name: user.name,
                email: user.email,
                balances: user.balances 
            }
        });

    } catch (error) {
        console.error('Błąd podczas logowania użytkownika (w bloku catch):', error);
        res.status(500).json({ message: 'Wystąpił błąd serwera podczas logowania.' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    users 
};