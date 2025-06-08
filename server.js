const express = require('express');
const path = require('path'); 
const app = express();

const currencyRoutes = require('./routes/currencyRoutes');

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api-welcome', (req, res) => { 
  res.send('Kantor api');
});

app.use('/api', currencyRoutes);


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
});