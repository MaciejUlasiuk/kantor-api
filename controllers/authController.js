const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let users = [];

const generateToken = (id, email, role) => {
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not defined.");
    return jwt.sign({ id, email, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
};

const registerUser = async (req, res, next) => {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email i hasło są wymagane.' });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ message: 'Nieprawidłowy format adresu email.' });
    if (password.length < 6) return res.status(400).json({ message: 'Hasło musi mieć co najmniej 6 znaków.' });

    try {
        if (users.find(user => user.email === email)) {
            const error = new Error('Użytkownik o podanym adresie email już istnieje.');
            error.statusCode = 409;
            throw error;
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        let role = 'user';
        if (users.length === 0 || email === process.env.ADMIN_EMAIL) role = 'admin';
        const newUser = {
            id: users.length > 0 ? users[users.length - 1].id + 1 : 1,
            name: name || email.split('@')[0], email, password: hashedPassword, role,
            createdAt: new Date().toISOString(),
            balances: { PLN: 1000.00, USD: 0.00, EUR: 0.00, CHF: 0.00 },
            transactions: []
        };
        users.push(newUser);
        const token = generateToken(newUser.id, newUser.email, newUser.role);
        res.status(201).json({
            message: 'Użytkownik zarejestrowany pomyślnie.', token,
            user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, createdAt: newUser.createdAt, balances: newUser.balances }
        });
    } catch (error) { next(error); }
};

const loginUser = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email i hasło są wymagane.' });
    try {
        const user = users.find(u => u.email === email);
        if (!user) { const error = new Error('Nieprawidłowy email lub hasło.'); error.statusCode = 401; throw error; }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) { const error = new Error('Nieprawidłowy email lub hasło.'); error.statusCode = 401; throw error; }
        const token = generateToken(user.id, user.email, user.role);
        res.status(200).json({
            message: 'Zalogowano pomyślnie.', token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, balances: user.balances }
        });
    } catch (error) { next(error); }
};

const deleteAccount = async (req, res, next) => {
    const userIdToDelete = req.user.id; 
    try {
        const userIndex = users.findIndex(u => u.id === userIdToDelete);
        if (userIndex === -1) {
            const error = new Error('Użytkownik nie został znaleziony.'); 
            error.statusCode = 404;
            throw error;
        }
        users.splice(userIndex, 1); 
        console.log(`Użytkownik o ID ${userIdToDelete} usunął swoje konto.`);
        res.status(200).json({ message: 'Konto zostało pomyślnie usunięte.' });
    } catch (error) {
        next(error);
    }
};

module.exports = { registerUser, loginUser, deleteAccount, users };