const express = require('express');
const app = express();

const currencyRoutes = require('./routes/currencyRoutes'); 

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Witaj w Kantor API!');
});

app.use('/api', currencyRoutes); 

app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
});