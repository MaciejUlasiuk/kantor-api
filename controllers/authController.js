const bcrypt = require('bcryptjs');

const users = []; 


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
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        //usun pozniej
        console.log('Zarejestrowano nowego użytkownika:', newUser.email, 'Aktualna lista użytkowników:', users.map(u => u.email)); 

        res.status(201).json({
            message: 'Użytkownik zarejestrowany pomyślnie.',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                createdAt: newUser.createdAt
            }
        });

    } catch (error) {
        console.error('Błąd podczas rejestracji użytkownika:', error);
        res.status(500).json({ message: 'Błąd podczas rejestracji użytkownika.' });
    }
};

module.exports = {
    registerUser,
};