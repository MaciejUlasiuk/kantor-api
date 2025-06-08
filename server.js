require('dotenv').config();

const express = require('express');
const path = require('path'); 
const app = express();
const cors = require('cors');


const currencyRoutes = require('./routes/currencyRoutes');
const authRoutes = require('./routes/authRoutes')
const transactionRoutes = require('./routes/transactionRoutes');

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api-welcome', (req, res) => { 
  res.send('Kantor api');
});

app.use('/api', currencyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
});